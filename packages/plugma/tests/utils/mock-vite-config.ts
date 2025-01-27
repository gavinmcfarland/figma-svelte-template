import type { UserConfig } from 'vite';

import type { ViteConfigs } from '#utils/config/create-vite-configs.js';

export const baseConfig: Omit<UserConfig, 'mode'> = {
  base: '/',
  root: process.cwd(),
  cacheDir: '.vite',
  publicDir: 'public',
  resolve: {
    alias: [],
    dedupe: [],
    conditions: [],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    preserveSymlinks: false,
  },
  build: {
    target: 'modules',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: 'src/main.ts',
    },
    lib: {
      entry: '/mock/temp/file.js',
      formats: ['cjs'],
      name: 'plugin',
    },
    sourcemap: false,
    emptyOutDir: false,
  },
  server: {
    port: 3000,
    strictPort: true,
    host: 'localhost',
    cors: true,
  },
  plugins: [] as const,
  define: {},
};

/**
 * Creates a mock Vite configuration for testing.
 */
export function createMockViteConfig(
  mode: 'development' | 'production' = 'development',
): ViteConfigs {
  const resolvedConfig: UserConfig = {
    ...baseConfig,
    mode,
    define: { 'process.env.NODE_ENV': `"${mode}"` } as {
      [key: string]: string;
    },
  };

  return {
    ui: {
      dev: {
        ...resolvedConfig,
        define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
      },
      build: {
        ...resolvedConfig,
        build: {
          emptyOutDir: false,
          ...resolvedConfig.build,
          rollupOptions: { input: 'node_modules/plugma/tmp/index.html' },
        },
      },
    },
    main: {
      dev: {
        ...resolvedConfig,
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode),
          'figma.ui.resize': 'customResize',
          'figma.showUI': 'customShowUI',
        },
        build: {
          ...resolvedConfig.build,
          // lib: {
          //   entry: resolvedConfig.build.lib.entry,
          //   formats: ['cjs'],
          // },
          rollupOptions: {
            output: {
              entryFileNames: 'main.js',
              inlineDynamicImports: true,
            },
          },
          target: 'chrome58',
        },
      },
      build: {
        ...resolvedConfig,
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode),
        },
        build: {
          // lib: {
          //   entry: resolvedConfig.build.lib.entry,
          //   formats: ['cjs'],
          // },
          rollupOptions: {
            output: {
              entryFileNames: 'main.js',
              inlineDynamicImports: true,
            },
          },
          target: 'chrome58',
        },
      },
    },
  } satisfies ViteConfigs;
}
