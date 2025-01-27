import fs from 'node:fs';
import path from 'node:path';

import type { Plugin, UserConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { writeTempFile } from '#utils';
import { getDirName } from '#utils/path.js';
import {
  deepIndex,
  dotEnvLoader,
  htmlTransform,
  replaceMainInput,
  rewritePostMessageTargetOrigin,
  viteCopyDirectoryPlugin,
  vitePluginInsertCustomFunctions,
} from '#vite-plugins';

const __dirname = getDirName(import.meta.url);

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

// TODO Check if this should become a task

/**
 * Creates Vite configurations for both development and build
 * @param options - Plugin configuration options
 * @param userFiles - User's plugin files configuration
 * @returns Vite configurations for different environments
 */
export function createViteConfigs(
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

  // Read the banner code from utils/cli/banner.js
  const bannerCode = fs.readFileSync(
    path.join(__dirname, '..', 'cli', 'banner.js'),
    'utf8',
  );
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
    ui: viteConfig,
    main: {
      dev: viteConfigMainDev,
      build: viteConfigMainBuild,
    },
  };
}
