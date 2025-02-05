import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { defaultLogger, writeTempFile } from '#utils';
import { getDirName } from '#utils/get-dir-name.js';
import {
	dotEnvLoader,
	htmlTransform,
	injectRuntime,
	replacePlaceholders,
	rewritePostMessageTargetOrigin,
	serveUi,
} from '#vite-plugins';

const projectRoot = path.join(getDirName(), '../../..');
const uiHtml = path.join(projectRoot, 'templates/ui.html');

// Before using the runtime code, bundle it
const runtimeBundlePath = path.join(
  projectRoot,
  'dist/apps/plugma-runtime.js',
);

const plugmaRuntimeCode = fs.readFileSync(runtimeBundlePath, 'utf8');

export type ViteConfigs = {
  ui: {
    dev: UserConfig;
    build: UserConfig;
  };
  main: {
    dev: UserConfig;
    build: UserConfig;
  };
};

/**
 * Creates Vite configurations for both development and build
 *
 * @param options - Plugin configuration options
 * @param userFiles - User's plugin files configuration
 * @returns Vite configurations for different environments
 */
export function createViteConfigs(
  options: PluginOptions,
  userFiles: UserFiles,
): ViteConfigs {
  defaultLogger.debug('Creating Vite configs with:', {
    browserIndexPath: uiHtml,
    outputDir: options.output,
    cwd: process.cwd(),
  });

  // Copy template to the current working directory
  const localUiHtml = path.join(process.cwd(), 'ui.html');
  fs.copyFileSync(uiHtml, localUiHtml);

  const commonVitePlugins: Plugin[] = [viteSingleFile()];

  const placeholders = {
    pluginName: userFiles.manifest.name,
    pluginUi: `<script type="module" src="${userFiles.manifest.ui}"></script>`,
  };

  const viteConfigUI = {
    dev: {
      mode: options.mode,
      define: { 'process.env.NODE_ENV': JSON.stringify(options.mode) },
      plugins: [
        replacePlaceholders(placeholders),
        htmlTransform(options),
        rewritePostMessageTargetOrigin(),
        serveUi(options),
        ...commonVitePlugins,
      ],
      server: {
        port: options.port,
        cors: true,
        host: 'localhost',
        strictPort: true,
        middlewareMode: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        },
      },
      logLevel: options.debug ? 'info' : 'error',
    } satisfies UserConfig,
    build: {
      root: process.cwd(),
      base: './',
      build: {
        outDir: path.resolve(process.cwd(), options.output),
        emptyOutDir: false,
        write: true,
        rollupOptions: {
          input: localUiHtml,
          output: {
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            assetFileNames: (assetInfo: { name?: string }) => {
              defaultLogger.debug('assetFileNames called with:', assetInfo);
              if (!assetInfo.name) return '[name].[ext]';
              const basename = path.basename(assetInfo.name);
              return basename === 'ui.html' ? 'ui.html' : basename;
            },
          },
        },
      },
      plugins: [replacePlaceholders(placeholders), ...commonVitePlugins],
    } satisfies UserConfig,
  };

	const configKey = options.command === 'build' ?  'build' : 'dev';
	defaultLogger.debug(`Vite config UI (configKey):`, viteConfigUI[configKey]);

  const tempFilePath = writeTempFile(
    `temp_${Date.now()}.js`,
    userFiles,
    options,
  );

  options.manifest = userFiles.manifest;

  const viteConfigMainBuild: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
    },
    plugins: [
      dotEnvLoader(options),
      injectRuntime({
        runtimeCode: plugmaRuntimeCode,
        pluginOptions: options,
      }),
    ],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      rollupOptions: {
        output: {
          dir: options.output,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
          format: 'cjs',
          exports: 'auto',
          generatedCode: {
            constBindings: true,
            objectShorthand: true,
          },
        },
        external: ['figma'],
      },
      target: 'es6',
      sourcemap: 'inline',
      minify: options.command === 'build',
      emptyOutDir: false,
      write: true,
      watch: null,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;

  const viteConfigMainDev: UserConfig = {
    mode: options.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
      'process.env.COMMAND': JSON.stringify(options.command),
      'process.env.DEBUG': JSON.stringify(!!options.debug),
      'figma.ui.resize': 'customResize',
      'figma.showUI': 'customShowUI',
    },
    plugins: [
      dotEnvLoader({
        ...options,
        patterns: ['*.env.*'],
      }),
      injectRuntime({
        runtimeCode: plugmaRuntimeCode,
        pluginOptions: options,
      }),
    ],
    build: {
      lib: {
        entry: tempFilePath,
        formats: ['cjs'],
        fileName: () => 'main.js',
      },
      rollupOptions: {
        output: {
          dir: options.output,
          entryFileNames: 'main.js',
          inlineDynamicImports: true,
        },
      },
      target: 'es6',
      sourcemap: 'inline',
      emptyOutDir: false,
      write: true,
      watch:
        options.watch || ['dev', 'preview'].includes(options.command ?? '')
          ? {
              clearScreen: false,
              exclude: ['node_modules/**'],
            }
          : null,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  } satisfies UserConfig;


	defaultLogger.debug(`Vite config Main (configKey):`, configKey === 'dev' ? viteConfigMainDev : viteConfigMainBuild);
  return {
    ui: viteConfigUI,
    main: {
      dev: viteConfigMainDev,
      build: viteConfigMainBuild,
    },
  };
}
