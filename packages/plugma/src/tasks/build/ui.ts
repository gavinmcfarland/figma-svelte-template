/**
 * UI build task implementation
 */

import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { join } from 'node:path';
import { build } from 'vite';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';
import { viteState } from '../server/vite.js';

/**
 * Result type for the build-ui task
 */
type Result = {
  outputPath: string;
};

export type BuildUiTask = GetTaskTypeFor<typeof BuildUiTask>;

export const BuildUiTask = task(
  'build:ui',
  async (
    options: PluginOptions,
    context: ResultsOfTask<GetFilesTask>,
  ): Promise<Result> => {
    try {
      const log = new Logger({ debug: options.debug });

      const fileResult = context[GetFilesTask.name];
      if (!fileResult) {
        throw new Error('get-files task must run first');
      }

      const { files } = fileResult;
      const outputPath = join(options.output || 'dist', 'ui.html');

      // Close existing UI server if any
      if (viteState.viteUi) {
        await viteState.viteUi.close();
      }

      // Only build if UI is specified
      if (files.manifest.ui) {
        log.debug(`Building UI from ${files.manifest.ui}...`);

        // Build UI with Vite
        await build({
          root: process.cwd(),
          base: '/',
          build: {
            outDir: options.output || 'dist',
            emptyOutDir: false,
            sourcemap: true,
            minify: true, // Always minify in build command
            rollupOptions: {
              input: files.manifest.ui,
              output: {
                entryFileNames: 'ui.js',
                format: 'iife',
              },
            },
          },
        });

        log.success(`UI built successfully at ${outputPath}\n`);
      }

      return { outputPath };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to build UI: ${errorMessage}`);
    }
  },
);

export default BuildUiTask;
