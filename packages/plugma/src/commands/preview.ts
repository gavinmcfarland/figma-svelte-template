/**
 * Preview command implementation
 * Handles preview server for testing plugin builds
 */

import type { PluginOptions } from '#core/types.js';
import { getRandomPort } from '#utils';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { BuildMainTask } from '../tasks/build/main.js';
import { BuildManifestTask } from '../tasks/build/manifest.js';
import { BuildUiTask } from '../tasks/build/ui.js';
import { GetFilesTask } from '../tasks/common/get-files.js';
import { ShowPlugmaPromptTask } from '../tasks/common/prompt.js';
import { serial } from '../tasks/runner.js';
import { StartViteServerTask } from '../tasks/server/vite.js';
import type { DevCommandOptions } from './types.js';

/**
 * Main preview command implementation
 * Sets up a preview environment for testing built plugins
 *
 * @param options - Preview configuration options
 * @remarks
 * The preview command is similar to dev but optimized for testing:
 * - Uses production-like builds
 * - Includes development server
 * - Supports WebSocket communication
 * - Enables testing plugin functionality
 */
export async function preview(options: DevCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting preview server...');

    const pluginOptions: PluginOptions = {
      ...options,
      mode: options.mode || 'preview',
      instanceId: nanoid(),
      port: options.port || getRandomPort(),
      output: options.output || 'dist',
      command: 'preview',
    };

    // Execute tasks in sequence
    log.info('Executing tasks...');
    await serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildManifestTask,
      BuildMainTask,
      BuildUiTask,
      StartViteServerTask,
    )(pluginOptions);

    log.success('Preview server started successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to start preview server:', errorMessage);
    throw error;
  }
}
