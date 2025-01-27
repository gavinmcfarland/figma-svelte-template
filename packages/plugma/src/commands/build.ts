/**
 * Build command implementation
 * Handles production builds and watch mode for plugin development
 */

import type { PluginOptions } from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { BuildMainTask } from '../tasks/build/main.js';
import { BuildManifestTask } from '../tasks/build/manifest.js';
import { BuildUiTask } from '../tasks/build/ui.js';
import { GetFilesTask } from '../tasks/common/get-files.js';
import { ShowPlugmaPromptTask } from '../tasks/common/prompt.js';
import { serial } from '../tasks/runner.js';
import type { BuildCommandOptions } from './types.js';

/**
 * Main build command implementation
 * Creates production-ready builds of the plugin
 *
 * @param options - Build configuration options
 * @remarks
 * The build command creates optimized production builds:
 * - Minified and optimized code
 * - Production UI build
 * - Manifest generation
 * - Optional watch mode for development
 */
export async function build(options: BuildCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting production build...');
    log.debug(`Build options: ${JSON.stringify(options)}`);

    const pluginOptions: PluginOptions = {
      ...options,
      mode: options.mode || 'production',
      instanceId: nanoid(),
      port: 3000, // Build command doesn't need a port, but it's required by PluginOptions
      output: options.output || 'dist',
      command: 'build',
    };

    log.debug(`Plugin options: ${JSON.stringify(pluginOptions)}`);

    // Execute tasks in sequence
    log.info('Executing tasks...');

    // Pass the task objects directly
    const results = await serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildManifestTask,
      BuildMainTask,
      BuildUiTask,
    )(pluginOptions);

    log.debug(`Task execution results: ${JSON.stringify(results, null, 2)}`);

    log.success('Production build completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to build plugin:', errorMessage);
    throw error;
  }
}
