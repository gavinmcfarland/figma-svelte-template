/**
 * This module handles the build and development process for Figma plugins,
 * including manifest generation, file watching, and Vite server management.
 */

import chalk from 'chalk';
import type { FSWatcher } from 'chokidar';
import chokidar from 'chokidar';
import fse from 'fs-extra';
import { nanoid } from 'nanoid';
import fs from 'node:fs/promises';
import path, { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import type { ScriptOptions } from '../bin/types';
import { Log } from '../src/logger';
import suppressLogs from '../src/suppress-logs';
import type { TaskOptions } from '../task-runner/taskrunner';
import { run, serial, task } from '../task-runner/taskrunner';
import type { ManifestFile, PluginOptions, UserFiles } from './utils';
import {
  cleanManifestFiles,
  createConfigs,
  getUserFiles,
  readJson,
} from './utils.js';

interface TaskContext extends TaskOptions {
  files?: UserFiles;
  config?: any;
  plugmaPkg?: any;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

let viteServerInstance: ViteDevServer | null = null;
const viteBuildInstance: ViteDevServer | null = null;
const viteUiInstance: ViteDevServer | null = null;

/**
 * Restarts the Vite development server with updated configuration
 * @param command - The command being executed (dev, preview, build)
 * @param options - Plugin configuration options
 */
async function restartViteServer(
  command: string,
  options: PluginOptions,
): Promise<void> {
  if (viteServerInstance) {
    await viteServerInstance.close();
  }

  const files = await getUserFiles(options);
  const config = createConfigs(options, files);

  if (files.manifest.ui) {
    if (options.command === 'dev' || options.command === 'preview') {
      await run('build-placeholder-ui', { command, options });

      viteServerInstance = await createServer(config.vite.dev);
      await viteServerInstance.listen();
    } else {
      await run('build-ui', { command, options });
    }
  }
}

/**
 * Main script runner that orchestrates the build and development process
 * @param command - The command to execute (dev, preview, build)
 * @param options - Plugin configuration options
 */
export async function runScript(
  command: 'preview' | 'dev' | 'build',
  options: PluginOptions | ScriptOptions,
): Promise<void> {
  suppressLogs(options);

  const log = new Log({ debug: options.debug });

  // Add command to options
  options.command = command;
  options.instanceId = nanoid();

  task('get-files', async (options: TaskOptions) => {
    const plugmaPkg = await readJson(resolve(__dirname, '../package.json'));
    const files = await getUserFiles(options as PluginOptions);
    const config = createConfigs(options as PluginOptions, files);
    return { plugmaPkg, files, config };
  });

  task('show-plugma-prompt', async (options: TaskOptions) => {
    const { plugmaPkg } = options as TaskContext;
    const log = new Log();
    log.info(`
${chalk.bold('Plugma')} v${plugmaPkg.version}
${chalk.dim('A modern Figma plugin development toolkit')}
`);

    if (
      options.command === 'dev' ||
      options.command === 'preview' ||
      (options.command === 'build' && options.watch)
    ) {
      console.log('Watching for changes...');
    }
  });

  task('build-manifest', async (options: TaskOptions) => {
    const { files, config } = options as TaskContext;
    const pluginOptions = options as PluginOptions;
    if (!files) throw new Error('Files not found');

    let previousUiValue: string | undefined = undefined;
    let previousMainValue: string | undefined = undefined;

    /**
     * Builds and writes the manifest file with merged configurations
     */
    const buildManifest = async () => {
      const files = await getUserFiles(pluginOptions);
      const outputDirPath = path.join(pluginOptions.output, 'manifest.json');

      const defaultValues: Partial<ManifestFile> = {
        api: '1.0.0',
      };

      const overriddenValues: Partial<ManifestFile> = {};

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

      await fse.outputFile(
        outputDirPath,
        JSON.stringify(mergedManifest, null, 2),
      );

      return {
        raw: files.manifest,
        processed: mergedManifest,
      };
    };

    // Initial build
    const { raw } = await buildManifest();
    previousUiValue = raw.ui;
    previousMainValue = raw.main;

    // Set up watcher if options.watch is true
    if (
      options.command === 'dev' ||
      options.command === 'preview' ||
      (options.command === 'build' && options.watch)
    ) {
      const manifestPath = resolve('./manifest.json');
      const userPkgPath = resolve('./package.json');
      const srcPath = resolve('./src');

      // Watch manifest and package.json changes
      chokidar.watch([manifestPath, userPkgPath]).on('change', async () => {
        const { raw } = await buildManifest();

        await restartViteServer(command, options as PluginOptions);

        if (raw.main !== previousMainValue) {
          previousMainValue = raw.main;
          await run('build-main', { command, options });
        }

        const files = await getUserFiles(options as PluginOptions);

        if (
          !files.manifest.ui ||
          !(await fs
            .access(resolve(files.manifest.ui))
            .then(() => true)
            .catch(() => false))
        ) {
          if (viteUiInstance) {
            await viteUiInstance.close();
          }
        }

        cleanManifestFiles(options as PluginOptions, files, 'manifest-changed');
      });

      /**
       * Recursively gets all files in a directory
       * @param directory - The directory to scan
       * @returns Promise<string[]> Array of file paths
       */
      async function getFilesRecursively(directory: string): Promise<string[]> {
        const files: string[] = [];
        const entries = await fse.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = path.join(directory, entry.name);
          if (entry.isDirectory()) {
            files.push(...(await getFilesRecursively(entryPath)));
          } else if (entry.isFile()) {
            files.push(entryPath);
          }
        }

        return files;
      }

      // Track existing files
      const existingFiles = new Set<string>();
      const srcFiles = await getFilesRecursively(srcPath);
      for (const file of srcFiles) {
        existingFiles.add(file);
      }

      // Watch the src directory
      const watcher: FSWatcher = chokidar.watch([srcPath], {
        persistent: true,
        ignoreInitial: false,
      });

      watcher.on('add', async (filePath) => {
        if (existingFiles.has(filePath)) {
          return;
        }

        existingFiles.add(filePath);
        const { raw } = await buildManifest();
        const relativePath = path.relative(process.cwd(), filePath);

        if (relativePath === raw.ui) {
          await restartViteServer(command, options as PluginOptions);
        }
        if (relativePath === raw.main) {
          await run('build-main', { command, options });
        }

        const files = await getUserFiles(options as PluginOptions);
        cleanManifestFiles(options as PluginOptions, files, 'file-added');
      });

      watcher.on('unlink', (filePath) => {
        existingFiles.delete(filePath);
      });

      const files = await getUserFiles(options as PluginOptions);
      cleanManifestFiles(options as PluginOptions, files, 'on-initialisation');
    }
  });

  task('build-placeholder-ui', async (options: TaskOptions) => {
    const pluginOptions = options as PluginOptions;
    const files = await getUserFiles(pluginOptions);

    if (files.manifest.ui) {
      const uiPath = resolve(files.manifest.ui);
      const fileExists = await fs
        .access(uiPath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const devHtmlPath = resolve(`${__dirname}/../apps/PluginWindow.html`);
        let devHtmlString = await fs.readFile(devHtmlPath, 'utf8');

        pluginOptions.manifest = files.manifest;
        const runtimeData = `<script>
          // Global variables defined on the window object
          window.runtimeData = ${JSON.stringify(pluginOptions)};
        </script>`;

        devHtmlString = devHtmlString.replace(/^/, runtimeData);

        await fse.mkdir(path.join(pluginOptions.output), { recursive: true });
        await fse.writeFile(
          path.join(pluginOptions.output, 'ui.html'),
          devHtmlString,
        );
      }
    }
  });

  // Execute tasks
  await serial(['get-files', 'show-plugma-prompt', 'build-manifest'], options);
}
