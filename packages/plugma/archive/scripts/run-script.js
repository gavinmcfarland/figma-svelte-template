
import fs from 'fs/promises';
import fse from 'fs-extra';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import chokidar from 'chokidar';
import { transformObject } from './utils.js';

import _ from 'lodash';
import chalk from 'chalk';
import { build as viteBuild, createServer, mergeConfig, build } from 'vite';
import { nanoid } from 'nanoid';

import { Log } from '../lib/logger.js';
import { getRandomNumber, readJson, createConfigs, getUserFiles, formatTime, cleanManifestFiles } from './utils.js';
import { task, run, serial } from '../task-runner/taskrunner.js';
import { suppressLogs } from '../lib/suppress-logs.js';
import { logFileUpdates } from '../lib/vite-plugins/vite-plugin-log-file-updates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

let viteServerInstance = null;
let viteBuildInstance = null;
let viteUiInstance = null;

async function restartViteServer(command, options) {

	if (viteServerInstance) {
		await viteServerInstance.close();
	}
	const files = await getUserFiles(options)
	const config = createConfigs(options, files);

	if (files.manifest.ui) {

		if (options.command === "dev" || options.command === "preview") {
			await run('build-placeholder-ui', { command, options });

			viteServerInstance = await createServer(config.vite.dev);
			await viteServerInstance.listen();
		}
		else {
			await run('build-ui', { command, options });
		}



	}

}

export async function runScript(command, options) {

	suppressLogs(options);

	const log = new Log({ debug: options.debug });

	// Add command to options
	options.command = command
	options.instanceId = nanoid()

	task('get-files', async ({ options }) => {
		const plugmaPkg = await readJson(resolve(`${__dirname}/../package.json`));
		const files = await getUserFiles(options);
		const config = createConfigs(options, files);

		return { plugmaPkg, files, config };
	});

	task('show-plugma-prompt', async ({ files, plugmaPkg }) => {
		log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + plugmaPkg.version)}\n`);

		if (options.command === "dev" || options.command === "preview" || (options.command === "build") && options.watch) {
			console.log('Watching for changes...')
		}
	});

	task('build-manifest', async ({ files, options, config }) => {

		let previousUiValue = null;
		let previousMainValue = null;

		const buildManifest = async () => {
			const files = await getUserFiles(options)

			const outputDirPath = path.join(options.output, 'manifest.json');

			const defaultValues = {
				api: '1.0.0',
			};

			const overriddenValues = {};

			if (files.manifest.main) {
				overriddenValues.main = 'main.js';
			}

			if (files.manifest.ui) {
				overriddenValues.ui = 'ui.html';
			}

			const mergedManifest = {
				...defaultValues,
				...files.manifest,
				...overriddenValues,
			};

			await fse.outputFile(outputDirPath, JSON.stringify(mergedManifest, null, 2));

			return {
				raw: files.manifest,
				processed: mergedManifest
			}

		};

		// Initial build
		const { raw } = await buildManifest();
		previousUiValue = raw.ui;
		previousMainValue = raw.main;

		// Set up watcher if options.watch is true
		if (options.command === "dev" || options.command === "preview" || (options.command === "build" && options.watch)) {

			const manifestPath = resolve('./manifest.json');
			const userPkgPath = resolve('./package.json');
			const srcPath = resolve('./src');

			// If manifest changes, restart or rebuild
			chokidar.watch([manifestPath, userPkgPath]).on('change', async (path) => {

				const { raw } = await buildManifest();

				// Restart server whenever manifest updated
				await restartViteServer(command, options);

				if (raw.main !== previousMainValue) {
					previousMainValue = raw.main;

					// console.log('\n'.repeat(process.stdout.rows - 2));

					// process.stdout.write('\x1B[H');
					// console.log(chalk.grey(formatTime()) + chalk.cyan(chalk.bold(' [plugma]')) + chalk.green(' manifest changed'));
					await run('build-main', { command, options });

				}
				const files = await getUserFiles(options)

				if (!files.manifest.ui || !(await fs.access(resolve(files.manifest.ui)).then(() => true).catch(() => false))) {
					if (viteUiInstance) {

						await viteUiInstance.close(); // Stop watching
					}
				}


				cleanManifestFiles(options, files, "manifest-changed")
			});


			// Utility function to recursively gather files in the directory
			async function getFilesRecursively(directory) {
				const files = [];
				const entries = await fse.readdir(directory, { withFileTypes: true });
				for (const entry of entries) {
					const entryPath = path.join(directory, entry.name);
					if (entry.isDirectory()) {
						files.push(...await getFilesRecursively(entryPath));
					} else if (entry.isFile()) {
						files.push(entryPath);
					}
				}
				return files;
			}

			// Get initial list of files in srcPath to track already existing files
			const existingFiles = new Set();
			const srcFiles = await getFilesRecursively(srcPath);
			srcFiles.forEach((file) => existingFiles.add(file));

			// Watch the srcPath directory, including subdirectories
			const watcher = chokidar.watch([srcPath], { persistent: true, ignoreInitial: false });

			// Handle the "add" event
			watcher.on('add', async (filePath) => {
				if (existingFiles.has(filePath)) {
					return; // Skip if the file was already present
				}

				// Add this file to existingFiles
				existingFiles.add(filePath);

				const { raw } = await buildManifest();
				const relativePath = path.relative(process.cwd(), filePath);

				// Check if the relative path matches raw.ui or raw.main
				if (relativePath === raw.ui) {
					await restartViteServer(command, options);
				}
				if (relativePath === raw.main) {
					// console.log('\n'.repeat(process.stdout.rows - 2));

					// process.stdout.write('\x1B[H');
					// console.log(chalk.grey(formatTime()) + chalk.cyan(chalk.bold(' [plugma]')) + chalk.green(' main built'));

					await run('build-main', { command, options });
				}

				const files = await getUserFiles(options);
				cleanManifestFiles(options, files, "file-added");
			});

			// Handle the "unlink" event to remove the file from existingFiles
			watcher.on('unlink', (filePath) => {
				if (existingFiles.has(filePath)) {
					existingFiles.delete(filePath);
				}
			});

			const files = await getUserFiles(options);
			cleanManifestFiles(options, files, "on-initialisation");
		}
	});

	task('build-placeholder-ui', async ({ options }) => {
		const files = await getUserFiles(options);

		if (files.manifest.ui) {
			// Resolve the path for files.manifest.ui
			const uiPath = resolve(files.manifest.ui);

			const fileExists = await fs.access(uiPath).then(() => true).catch(() => false)

			// Check if the resolved path exists
			if (files.manifest.ui && fileExists) {
				const devHtmlPath = resolve(`${__dirname}/../apps/PluginWindow.html`);
				let devHtmlString = await fs.readFile(devHtmlPath, 'utf8');

				options.manifest = files.manifest
				const runtimeData = `<script>
				// Global variables defined on the window object
				window.runtimeData = ${JSON.stringify(options)};
			</script>`;

				devHtmlString = devHtmlString.replace(/^/, runtimeData);

				// Create the output directory and write the modified HTML file
				await fse.mkdir(path.join(options.output), { recursive: true });
				await fse.writeFile(path.join(options.output, 'ui.html'), devHtmlString);
			}
		}


	});

	task('build-ui', async ({ command, options }) => {
		if (viteUiInstance) {
			await viteUiInstance.close(); // Stop watching
		}
		// Start the timer as close to the build call as possible

		const files = await getUserFiles(options)
		const config = createConfigs(options, files);

		const startTime = performance.now();

		if (files.manifest.ui && await fs.access(resolve(files.manifest.ui)).then(() => true).catch(() => false)) {
			// log.text('built ui')

			if (command === "build" && options.watch) {

				// FIXME: For some reason, it rebuilds ui.html when not specified in manifest during watch
				viteUiInstance = await viteBuild(mergeConfig({
					build: {
						watch: {},
						minify: true
					},
				}, config.vite.build));
			} else {
				await viteBuild(mergeConfig({
					build: {
						minify: true
					},
				}, config.vite.build));
			}
		}

		// Calculate elapsed time in milliseconds
		const endTime = performance.now();
		const buildDuration = ((endTime - 250) - startTime).toFixed(0); // Remove decimals for a Vite-like appearance



		// NOTE: Couldn't decide on whether to show a 'errors with build' message
		if (!options.watch && files.manifest.main && await fs.access(resolve(files.manifest.main)).then(() => true).catch(() => false)) {
			if ((files.manifest.ui && await fs.access(resolve(files.manifest.ui)).then(() => true).catch(() => false))) {
				log.text(`${chalk.green('✓ build created in ' + buildDuration + 'ms')} `);
			}
			else if (!files.manifest.ui) {
				log.text(`${chalk.green('✓ build created in ' + buildDuration + 'ms')} `);
			}
			else {
				// log.text(`${ chalk.red('✕ errors with build\n') } `);
			}
		}
		else {
			// log.text(`${ chalk.red('✕ errors with build\n') } `);
		}

		cleanManifestFiles(options, files, "plugin-built")
	});

	task('build-main', async ({ command }) => {

		if (viteBuildInstance) {
			await viteBuildInstance.close(); // Stop watching
		}


		const files = await getUserFiles(options);

		if (files.manifest.main) {

			// Resolve the path for files.manifest.ui
			const mainPath = resolve(files.manifest.main);

			const fileExists = await fs.access(mainPath).then(() => true).catch(() => false)

			if (fileExists) {


				// FIXME: Had to do all of this because of two issues:
				// 1. Vite seems to be caching config when watching
				// 2. dotenv was also caching env files
				let isBuilding = false;



				const envFiles = [
					path.resolve(process.cwd(), '.env'),
					path.resolve(process.cwd(), '.env.local'),               // Default .env
					path.resolve(process.cwd(), `.env.${process.env.NODE_ENV} `), // Environment-specific .env (e.g., .env.development, .env.production)
					path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`)             // Local overrides, if any
				];

				// Function to start the build
				async function runBuild() {

					const files = await getUserFiles(options)
					const config = createConfigs(options, files);

					if (isBuilding) {
						console.log('[vite-build] Build already in progress. Waiting for it to complete before restarting.');
						return;
					}

					isBuilding = true; // Set the flag indicating a build is in progress

					try {
						if (command === 'dev' || command === 'preview') {
							let merged = mergeConfig({ build: { watch: {}, minify: false }, plugins: [logFileUpdates()] }, config.viteMain.dev)
							viteBuildInstance = await viteBuild(merged);
						}
						else if (command === "build" && options.watch) {
							let merged = mergeConfig({ build: { watch: {}, minify: true } }, config.viteMain.build)
							viteBuildInstance = await viteBuild(merged);
						} else {
							if (files.manifest.main && await fs.access(resolve(files.manifest.main)).then(() => true).catch(() => false)) {
								let merged = mergeConfig({ build: { minify: true } }, config.viteMain.build)
								viteBuildInstance = await viteBuild(merged);
							}

						}
					} catch (error) {
						console.error('[vite-build] Build failed:', error);
					} finally {
						isBuilding = false; // Reset the flag after the build completes
					}
				}



				// Function to watch environment files and restart the build process when changes occur
				function watchEnvFiles() {
					const watcher = chokidar.watch(envFiles);

					watcher.on('change', async (filePath) => {
						console.log(`[vite - build] Environment file changed: ${filePath}. Restarting build...`);
						runBuild(); // Restart the build process without exiting
					});
				}

				// Initial build run
				runBuild();



				if (command === 'dev' || command === 'preview' || command === "build" && options.watch) {
					// Start watching for changes in environment files
					watchEnvFiles();
				}
			}
		}

	});

	task('start-vite-server', async () => {

		const files = await getUserFiles(options)
		const config = createConfigs(options, files);

		if (files.manifest.ui) {

			viteServerInstance = await createServer(config.vite.dev);
			await viteServerInstance.listen();
		}


	});

	task('start-websockets-server', async ({ options }) => {
		if (options.websockets) {
			exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
			log.text(`Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}`)
		}
	})

	try {

		process.env.NODE_ENV = options.mode || 'development';
		options.port = options.port || getRandomNumber();

		// const plugmaPkg = await readJson(resolve(`${ __dirname } /../ package.json`));
		// const files = await getUserFiles();
		// const config = createConfigs(options, files)

		switch (command) {
			case 'dev':
			case 'preview':
				run((options) => {
					serial([
						'get-files',
						'show-plugma-prompt',
						'build-manifest',
						'build-placeholder-ui',
						'build-main',
						'start-websockets-server',
						'start-vite-server',

					], options);
				}, { command, options });
				break;

			case 'build':
				run((options) => {
					serial([
						'get-files',
						'show-plugma-prompt',
						'build-manifest',
						'build-ui',
						'build-main'


					], options);
				}, { command, options });
				break;
		}
	} catch (err) {
		console.error(`Error during ${command} process: `, err);
		process.exit(1);
	}
}
