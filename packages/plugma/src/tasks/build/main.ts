import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'vite';
/**
 * Main script build task implementation
 */
import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
// import type { TaskDefinition } from '#core/task-runner/types.js';
import { registerCleanup, unregisterCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';
import { viteState } from '../server/vite.js';

/**
 * Options for the build/main task
 */
type Options = PluginOptions & {
  entry: string;
  outDir: string;
};

/**
 * Result type for the build-main task
 */
type Result = {
  outputPath: string;
};

export type BuildMainTask = GetTaskTypeFor<typeof BuildMainTask>;

export const BuildMainTask = task(
  'build:main',
  async (
    options: Options,
    context: ResultsOfTask<GetFilesTask>,
  ): Promise<Result> => {
    try {
      const log = new Logger({ debug: options.debug });

      const fileResult = context[GetFilesTask.name];
      if (!fileResult) {
        throw new Error('get-files task must run first');
      }

      const { files } = fileResult;
      const outputPath = join(options.output || 'dist', 'main.js');

      // Close existing build server if any
      if (viteState.viteBuild) {
        await viteState.viteBuild.close();
      }

      // Register cleanup handler
      const cleanup = async () => {
        log.debug('Cleaning up main build...');
        if (viteState.viteBuild) {
          await viteState.viteBuild.close();
        }
        // In dev/preview, we want to clean up the build output
        if (options.command !== 'build') {
          try {
            await rm(outputPath, { force: true });
            log.success('Cleaned up main build output');
          } catch (error) {
            log.error('Failed to clean up main build output:', error);
          }
        }
      };
      registerCleanup(cleanup);

      // Only build if main script is specified
      if (files.manifest.main) {
        log.debug(`Building main script from ${files.manifest.main}...`);

        // Build main script with Vite
        await build({
          root: process.cwd(),
          base: '/',
          mode: options.mode,
          build: {
            outDir: options.output || 'dist',
            emptyOutDir: true,
            sourcemap: true,
            minify: options.command === 'build', // Only minify in build command
            lib: {
              entry: files.manifest.main,
              formats: ['iife'],
              name: 'plugin',
              fileName: () => 'main.js',
            },
            rollupOptions: {
              input: files.manifest.main,
              external: ['figma'],
              output: {
                globals: {
                  figma: 'figma',
                },
              },
            },
            watch: options.command !== 'build' ? {} : undefined,
          },
        });

        log.success('Main script built successfully at dist/main.js\n');
      }

      // Unregister cleanup handler in build mode
      if (options.command === 'build') {
        unregisterCleanup(cleanup);
      }

      return { outputPath };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to build main script: ${errorMessage}`);
    }
  },
);

export default BuildMainTask;
