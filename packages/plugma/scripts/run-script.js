import { createServer } from 'vite';
import esbuild from 'esbuild';
import fse from 'fs-extra';
import { exec } from 'child_process';
import { dirname, resolve, parse, join } from 'path';
import fs from 'fs';
import os, { type } from 'os';
import chalk from 'chalk';
import { build } from 'vite'
import { replace } from 'esbuild-plugin-replace';
import { fileURLToPath } from 'url';
import envfilePlugin from '../lib/esbuild-plugins/esbuild-plugin-envfile.js';
import htmlTransform from '../lib/vite-plugins/vite-plugin-html-transform.js';
import replaceMainInput from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import deepIndex from '../lib/vite-plugins/vite-plugin-replace-main-input.js';
import viteCopyDirectoryPlugin from '../lib/vite-plugins/vite-plugin-copy-dir.js';
import { viteSingleFile } from "vite-plugin-singlefile";
import _ from 'lodash';
import { Log } from '../lib/logger.js'
import lodashTemplate from 'lodash.template'

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export default async function cli(options) {

	// Allow CLI to set NODE_ENV
	process.env.NODE_ENV = options.mode || 'development';
	options.port = options.port || getRandomNumber()

	const pkg = await getJsonFile(resolve(`${__dirname}/../package.json`));
	const data = await getFiles();
	const viteConfigs = createViteConfigs(options, data);

	switch (options._[0]) {
		case 'build':
			await runBuildTask(options, data, viteConfigs.build, pkg)
			break;

		case 'dev':
			await runDevTask(options, data, viteConfigs.dev, pkg)
			break;

		default:
			console.error(`Unknown command: ${options._[0]}`);
			process.exit(1);
	}
}

async function runBuildTask(options, data, buildViteConfig, pkg) {
	if (options._[0] === "build") {

		Log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + pkg.version)}`, 0)

		await writeIndexFile()

		// ----- build manifest.json
		await writeManifestFile(data, () => {
			Log.text(`manifest.json file created!`, 1)
		})

		// ----- build main.js
		await bundleMainWithEsbuild(data, options.watch, () => {
			Log.text(`main.js file created!`, 1)
		}, 'production', options)

		Log.text(`Watching for changes...`, 0)

		// ----- build ui.html (no server needed)

		if (options.watch) {
			await build(_.merge({}, buildViteConfig, {
				build: {
					watch: {}
				}
			}));
		}
		else {
			await build(buildViteConfig)
		}
	}
}

async function runDevTask(options, data, devViteConfig, pkg) {
	if (options._[0] === "dev") {

		Log.text(`${chalk.blue.bold('Plugma')} ${chalk.grey("v" + pkg.version)}`, 0);

		await writeIndexFile()

		// ----- build ui.html
		// We don't need to bundle the UI because when developing it needs to point to the dev server. So instead we create a placeholder ui file that points to a server
		let devHtmlString = fs.readFileSync(`${__dirname}/../../apps/dist/PluginWindow.html`, 'utf8');

		let runtimeData = `<script>
		// Global variables defined on the window object
		window.runtimeData = {
			port: ${options.port}
		};
	</script>`

		devHtmlString = devHtmlString.replace(/^/, runtimeData)

		createFileWithDirectory(`${CURR_DIR}/dist`, 'ui.html', devHtmlString)

		Log.text(`ui.html file created!`, 1)

		// ----- build manifest.json
		await writeManifestFile(data, () => {
			Log.text(`manifest.json file created!`, 1)
		})

		// ----- build main.js
		await bundleMainWithEsbuild(data, true, () => {
			Log.text(`main.js file created!`, 1)
		}, 'development', options)

		Log.text(`Preview: ${chalk.cyan('http://localhost:')}${chalk.bold.cyan(options.port)}${chalk.cyan('/')}\n`)

		Log.text(`Watching for changes...`)

		// ----- run vite app server
		try {

			const server = await createServer(devViteConfig);

			await server.listen(); // Start the Vite server


			// Run a web socket server so postMessage works between browser and Figma. And so Figma theme works in browser
			const childProcess = exec('node node_modules/plugma/lib/start-web-sockets-server.cjs');
			// childProcess.stderr.on('data', (data) => {
			// 	console.error(`Script error: ${data}`);
			// });

			// return server


		} catch (err) {
			console.error('Error starting Vite server:', err);
			process.exit(1);
		}


	}
}

function createViteConfigs(options, data) {
	const commonPlugins = [
		viteSingleFile(),
		viteCopyDirectoryPlugin({
			sourceDir: 'dist/node_modules/plugma/tmp/',
			targetDir: 'dist/',
		}),
	];

	const devConfig = {
		mode: options.mode,
		define: {
			'process.env.NODE_ENV': JSON.stringify(options.mode),
		},
		plugins: [
			replaceMainInput({
				input: data.figmaManifest.ui,
			}),
			htmlTransform(options),
			deepIndex(),
			...commonPlugins,
		],
		server: {
			port: options.port,
			logLevel: 'silent',
		},
	};

	const buildConfig = {
		build: {
			emptyOutDir: false,
			rollupOptions: {
				input: 'node_modules/plugma/tmp/index.html',
			},
		},
		plugins: commonPlugins,
	};

	return { dev: devConfig, build: buildConfig };
}


async function getJsonFile(filePath) {

	return new Promise((resolve, reject) => {
		if (fs.existsSync(filePath)) {
			fs.readFile(filePath, 'utf8', function (err, data) {
				if (err) {
					reject(err);
				}
				// console.log(data)
				resolve(JSON.parse(data));
			});
		}
		else {
			resolve(false)
		}

	});
}

function formatTime() {
	var currentDate = new Date();
	var hours = currentDate.getHours();
	var minutes = currentDate.getMinutes();
	var seconds = currentDate.getSeconds();
	var meridiem = hours >= 12 ? 'PM' : 'AM';

	// Convert 24-hour format to 12-hour format
	hours = hours % 12;
	hours = hours ? hours : 12; // Handle midnight (12 AM)

	// Add leading zeros to minutes and seconds if needed
	minutes = minutes < 10 ? '0' + minutes : minutes;
	seconds = seconds < 10 ? '0' + seconds : seconds;

	// Concatenate the formatted time
	var formattedTime = hours + ':' + minutes + ':' + seconds + ' ' + meridiem;

	return formattedTime;
}

async function bundleMainWithEsbuild(data, shouldWatch, callback, NODE_ENV, options) {


	if (callback && typeof (callback) === "function") {
		callback();
	}

	try {

		function writeTempFile(fileName) {
			const tempFilePath = join(os.tmpdir(), fileName);
			const modifiedContent = `import main from "${CURR_DIR}/${data.figmaManifest.main}";
			main();`
			// if (NODE_ENV === "development") {
			fs.writeFileSync(tempFilePath, modifiedContent);
			// }
			return tempFilePath
		}

		const fileName = `temp_${Date.now()}.js`
		let tempFilePath = writeTempFile(fileName)


		if (options._[0] === "dev" || (options._[0] === "build" && options.watch)) {


			let ctx = await esbuild.context({
				entryPoints: [tempFilePath],
				outfile: `dist/main.js`,
				format: 'esm',
				bundle: true,
				target: 'es2016',
				define: {
					'process.env.NODE_ENV': JSON.stringify(options.mode),
				},
				plugins: [
					envfilePlugin({
						envPath: '.env',
						envTestPath: '.env.test',
						envDevelopmentPath: '.env.development',
					}),
					{
						name: 'rebuild-notify',
						setup(build) {
							// build.onLoad({ filter: /\.txt$/ }, async (args) => {
							// 	let text = await fs.promises.readFile(args.path, 'utf8')
							// 	return {
							// 		contents: JSON.stringify(text.split(/\s+/)),
							// 		loader: 'json',
							// 	}
							// })
							// build.onStart(() => {
							// 	tempFilePath = writeTempFile(fileName)
							// 	console.log('build started')
							// })
							// build.onStart(() => {
							// 	console.log('Rebuilding...');
							// });
							build.onEnd(async result => {
								console.log(`${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green('rebuilt')} ${chalk.grey('/dist/main.js')}`)
								// console.log(`main.ts built with ${result.errors.length} errors`);
								// HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
								// await fs.unlink(tempFilePath, (err => {
								// 	if (err) console.log(err);
								// }));
							})
						}
						,
					},
					replace({
						'__buildVersion': '"1.0.0"',
					})
				],
			});
			await ctx.watch();



		} else {
			// Fix me, needs to output js file
			// Bundle your .mjs file using esbuild
			await esbuild.build({
				entryPoints: [tempFilePath],
				outfile: `dist/main.js`,
				format: 'esm',
				bundle: true,
				target: 'es2016',
				define: {
					'process.env.NODE_ENV': JSON.stringify(options.mode),
				},
				plugins: [
					envfilePlugin({
						envPath: '.env',
						envTestPath: '.env.test',
						envDevelopmentPath: '.env.development',
					}),
				]
			});
		}



		// console.log('Main bundled successfully with esbuild!');
	} catch (err) {
		console.error('Error bundling file with esbuild:', err);
	}
}

async function getFiles() {

	let rootManifest = await getJsonFile(`./manifest.json`)
	let pkg = await getJsonFile(resolve(`./package.json`));
	let figmaManifest = rootManifest || pkg.plugma?.manifest;


	// Check if name missing from manifest in package or package.json
	if (!pkg.plugma?.manifest?.name && !rootManifest?.name) {
		console.warn(`Plugma: Using package name as plugin name will be depreciated. Please specify the name in the manifest.

Example: \`{ name: "My Plugin" }\``)
	}

	return {
		figmaManifest,
		pkg
	}
}

function createFileWithDirectory(filePath, fileName, fileContent, callback) {

	function callback(err, result) {
		if (err) {
			console.error('Error:', err);
		} else {
			console.log(result);
		}
	}
	// Extract the directory path
	const directoryPath = dirname(resolve(filePath, fileName));

	// Use fs.mkdir to create the directory
	fs.mkdir(directoryPath, { recursive: true }, (err) => {
		if (err) {
			callback(err);
		} else {
			// Write to the file using fs.writeFile
			fs.writeFile(resolve(filePath, fileName), fileContent, 'utf8', (err) => {
				if (err) {
					callback(err);
				} else {
					// callback(null, `${fileName} created successfully!`);
				}
			});
		}
	});
}

async function writeManifestFile(data, callback) {
	if (callback && typeof (callback) === "function") {
		callback();
	}

	let pluginName = data.figmaManifest.name ? data.figmaManifest.name : data.pkg.name

	let newManifest = {
		...data.figmaManifest, ...{
			"name": `${pluginName}`,
			"api": "1.0.0",
			"main": "main.js",
			"ui": "ui.html",
		}
	}

	return await createFileWithDirectory("./dist", "manifest.json", JSON.stringify(newManifest, null, 2))
}

async function writeIndexFile() {
	// let newIndexPath = `${CURR_DIR}/${projectName}/node_modules/plugma/index.html`;

	let indexTemplatePath = `${__dirname}/../templates/index.html`
	// Rewrite using os.tmpdir(), but to work, rewriteIndexFile needs to output file location to vite config
	let newIndexPath = `${__dirname}/../tmp/index.html`

	// Need to use process.env.INIT_CWD because otherwise package is referenced from the module and not the users project <- not sure this is true
	let pkgPath = resolve(`${CURR_DIR}/package.json`)

	let contents = fs.readFileSync(indexTemplatePath, 'utf8');
	let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	let comptempl = lodashTemplate(contents)

	let manifest = await getJsonFile(resolve('./manifest.json')) || pkg["plugma"]["manifest"];

	let input = resolve("/", manifest?.ui) || "/src/ui.ts"

	if (getJsonFile(resolve('./manifest.json'))) {
		contents = comptempl({ name: "figma", input })
	}

	await fse.outputFile(newIndexPath, contents);
}

function getRandomNumber() {
	const min = 3000;
	const max = 6999;
	return Math.floor(Math.random() * (max - min + 1)) + min;
}