/**
 * Utility functions for the build process, including file operations,
 * configuration generation, and manifest management.
 */

import chalk from 'chalk';
import fs from 'node:fs';
import os from 'node:os';
import path, { dirname, resolve } from 'node:path';
import { cwd } from 'node:process';
import { fileURLToPath } from 'node:url';
import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import viteCopyDirectoryPlugin from '../src/vite-plugins/vite-plugin-copy-dir';
import deepIndex from '../src/vite-plugins/vite-plugin-deep-index';
import dotEnvLoader from '../src/vite-plugins/vite-plugin-dot-env-loader';
import htmlTransform from '../src/vite-plugins/vite-plugin-html-transform';
import vitePluginInsertCustomFunctions from '../src/vite-plugins/vite-plugin-insert-custom-functions';
import replaceMainInput from '../src/vite-plugins/vite-plugin-replace-main-input';
import rewritePostMessageTargetOrigin from '../src/vite-plugins/vite-plugin-rewrite-postmessage-origin';

export interface PluginOptions {
  mode: string;
  port: number;
  output: string;
  command: 'preview' | 'dev' | null;
  instanceId: string;
  debug?: boolean;
  watch?: boolean;
  manifest?: ManifestFile;
  [key: string]: any;
}

export interface ManifestFile {
  name: string;
  main: string;
  ui?: string;
  api: string;
  networkAccess?: {
    devAllowedDomains?: string[];
    allowedDomains?: string[];
  };
  [key: string]: any;
}

export interface UserFiles {
  manifest: ManifestFile;
}

export interface ViteConfigs {
  vite: {
    dev: UserConfig;
    build: UserConfig;
  };
  viteMain: {
    dev: UserConfig;
    build: UserConfig;
  };
}

const CURR_DIR = cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

/**
 * Creates a file with its directory structure if it doesn't exist
 * @param filePath - Base directory path
 * @param fileName - Name of the file to create
 * @param fileContent - Content to write to the file
 * @param callback - Optional callback function
 */
export function createFileWithDirectory(
  filePath: string,
  fileName: string,
  fileContent: string,
  callback?: (err: Error | null, result?: string) => void,
): void {
  const defaultCallback = (err: Error | null, result?: string) => {
    if (err) {
      console.error('Error:', err);
    } else if (result) {
      console.log(result);
    }
  };

  const cb = callback || defaultCallback;
  const directoryPath = dirname(resolve(filePath, fileName));

  fs.mkdir(directoryPath, { recursive: true }, (err) => {
    if (err) {
      cb(err);
    } else {
      fs.writeFile(resolve(filePath, fileName), fileContent, 'utf8', (err) => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      });
    }
  });
}

/**
 * Generates a random port number between 3000 and 6999
 */
export function getRandomNumber(): number {
  return Math.floor(Math.random() * (6999 - 3000 + 1)) + 3000;
}

/**
 * Formats the current time in 12-hour format with AM/PM
 */
export function formatTime(): string {
  const currentDate = new Date();
  let hours = currentDate.getHours();
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes}:${seconds} ${meridiem}`;
}

/**
 * Reads and parses a JSON file
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON object or false if file doesn't exist
 */
export async function readJson<T>(filePath: string): Promise<T | false> {
  if (fs.existsSync(filePath)) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }
  return false;
}

/**
 * Creates Vite configurations for both development and build
 * @param options - Plugin configuration options
 * @param userFiles - User's plugin files configuration
 * @returns Vite configurations for different environments
 */
export function createConfigs(
  options: PluginOptions,
  userFiles: UserFiles,
): ViteConfigs {
  const commonVitePlugins: Plugin[] = [
    viteSingleFile(),
    viteCopyDirectoryPlugin({
      sourceDir: path.join(options.output, 'node_modules', 'plugma', 'tmp'),
      targetDir: path.join(options.output),
    }),
  ];

  const tempFilePath = writeTempFile(
    `temp_${Date.now()}.js`,
    userFiles,
    options,
  );
  options.manifest = userFiles.manifest;

  const viteConfig = {
    dev: {
      mode: options.mode,
      define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
      plugins: [
        replaceMainInput({
          pluginName: userFiles.manifest.name,
          input: userFiles.manifest.ui,
        }),
        htmlTransform(options),
        deepIndex(),
        rewritePostMessageTargetOrigin(),
        ...commonVitePlugins,
      ],
      server: {
        port: options.port,
      },
    },
    build: {
      build: {
        outDir: path.join(options.output),
        emptyOutDir: false,
        rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
      },
      plugins: [
        replaceMainInput({
          pluginName: userFiles.manifest.name,
          input: userFiles.manifest.ui,
        }),
        ...commonVitePlugins,
      ],
    },
  };

  const bannerCode = fs.readFileSync(`${__dirname}/banner.js`, 'utf8');
  const injectedCode = bannerCode.replace(
    '//>> PLACEHOLDER : runtimeData <<//',
    `let runtimeData = ${JSON.stringify(options)};`,
  );

  const viteConfigMainBuild: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
    },
    plugins: [dotEnvLoader(options)],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          dir: path.join(options.output),
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'chrome58',
      sourcemap: false,
      emptyOutDir: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  const viteConfigMainDev: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
      'figma.ui.resize': 'customResize',
      'figma.showUI': 'customShowUI',
    },
    plugins: [
      dotEnvLoader(options),
      vitePluginInsertCustomFunctions({
        codeToPrepend: injectedCode,
      }),
    ],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          dir: `${options.output}`,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'chrome58',
      sourcemap: false,
      emptyOutDir: false,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  return {
    vite: viteConfig,
    viteMain: {
      dev: viteConfigMainDev,
      build: viteConfigMainBuild,
    },
  };
}

/**
 * Creates a plugin that notifies on rebuild events
 */
function notifyOnRebuild(options: PluginOptions): Plugin {
  let isInitialBuild = true;

  return {
    name: 'rebuild-notify',
    buildStart() {
      if (!isInitialBuild) {
        console.log(
          `${chalk.grey(formatTime())} ${chalk.cyan.bold('[esbuild]')} ${chalk.green(
            'rebuilt',
          )} ${chalk.grey(`/${options.output}/main.js`)}`,
        );
      }
      isInitialBuild = false;
    },
  };
}

/**
 * Replaces backslashes with forward slashes in a path string
 */
function replaceBackslashInString(stringPath: string): string {
  return path.sep === '\\'
    ? path.resolve(stringPath).split(path.sep).join('/')
    : stringPath;
}

/**
 * Writes a temporary file with the main plugin code
 */
function writeTempFile(
  fileName: string,
  userFiles: UserFiles,
  options: PluginOptions,
): string {
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const modifiedContentPath = replaceBackslashInString(
    path.join(CURR_DIR, userFiles.manifest.main),
  );
  const modifiedContent = `import plugmaMain from "${modifiedContentPath}";
    plugmaMain();`;
  fs.writeFileSync(tempFilePath, modifiedContent);
  return tempFilePath;
}

/**
 * Transforms network access configuration in the manifest
 */
export function transformObject(
  input: ManifestFile,
  options: PluginOptions,
): ManifestFile {
  const transformed = JSON.parse(JSON.stringify(input));

  if (transformed?.networkAccess?.devAllowedDomains) {
    transformed.networkAccess.devAllowedDomains =
      transformed.networkAccess.devAllowedDomains.map((domain: string) => {
        if (
          domain === 'http://localhost:*' ||
          domain === 'https://localhost:*'
        ) {
          return domain.replace('*', options.port.toString());
        }
        return domain;
      });
  }

  return transformed;
}

/**
 * Gets user's plugin files configuration
 */
export async function getUserFiles(options: PluginOptions): Promise<UserFiles> {
  const manifestPath = resolve('./manifest.json');
  const manifest = await readJson<ManifestFile>(manifestPath);

  if (!manifest) {
    throw new Error('manifest.json not found');
  }

  return {
    manifest: transformObject(manifest, options),
  };
}

/**
 * Cleans up manifest files based on the current state
 */
export async function cleanManifestFiles(
  options: PluginOptions,
  files: UserFiles,
  type: 'manifest-changed' | 'file-added' | 'on-initialisation',
): Promise<void> {
  const formatTime = () => new Date().toLocaleTimeString();

  const logStatusChange = (message: string) => {
    console.log(
      `${chalk.grey(formatTime())} ${chalk.cyan(chalk.bold('[plugma]'))} ${chalk.green(message)}`,
    );
  };

  const removeFileIfExists = async (filePath: string) => {
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  };

  const validateFile = async (filePath: string, fieldName: string) => {
    try {
      await fs.promises.access(resolve(filePath));
      return true;
    } catch {
      console.log(
        `${chalk.grey(formatTime())} ${chalk.cyan(chalk.bold('[plugma]'))} ${chalk.yellow(
          `Warning: ${fieldName} file not found at ${filePath}`,
        )}`,
      );
      return false;
    }
  };

  const mainJsPath = path.join(options.output, 'main.js');
  const uiHtmlPath = path.join(options.output, 'ui.html');

  if (!files.manifest.main) {
    await removeFileIfExists(mainJsPath);
  }

  if (!files.manifest.ui) {
    await removeFileIfExists(uiHtmlPath);
  }

  if (files.manifest.main) {
    await validateFile(files.manifest.main, 'Main');
  }

  if (files.manifest.ui) {
    await validateFile(files.manifest.ui, 'UI');
  }

  if (type === 'manifest-changed') {
    logStatusChange('manifest changed');
  } else if (type === 'file-added') {
    logStatusChange('file added');
  }
}
