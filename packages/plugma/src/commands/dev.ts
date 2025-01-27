/**
 * Development command implementation
 * Handles development server and file watching for plugin development
 */

import type { PluginOptions } from '#core/types.js';
import { getRandomPort } from '#utils/get-random-port.js';
import { Logger } from '#utils/log/logger.js';
import { nanoid } from 'nanoid';
import { BuildMainTask } from '../tasks/build/main.js';
import { BuildManifestTask } from '../tasks/build/manifest.js';
import { BuildUiTask } from '../tasks/build/ui.js';
import { GetFilesTask } from '../tasks/common/get-files.js';
import { ShowPlugmaPromptTask } from '../tasks/common/prompt.js';
import { serial } from '../tasks/runner.js';
import { RestartViteServerTask } from '../tasks/server/restart-vite.js';
import { StartViteServerTask } from '../tasks/server/vite.js';
import { StartWebSocketsServerTask } from '../tasks/server/websocket.js';
import type { DevCommandOptions } from './types.js';

/**
 * Main development command implementation
 * Starts a development server with live reload capabilities
 *
 * @param options - Development configuration options
 * @remarks
 * The dev command sets up a full development environment with:
 * - File watching and live reload
 * - Development UI with placeholder
 * - WebSocket communication
 * - Vite development server
 */
export async function dev(options: DevCommandOptions): Promise<void> {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Starting development server...');

    const pluginOptions: PluginOptions = {
      ...options,
      mode: options.mode || 'development',
      instanceId: nanoid(),
      port: options.port || getRandomPort(),
      output: options.output || 'dist',
      command: 'dev',
    };

    // Execute tasks in sequence
    log.info('Executing tasks...');
    await serial(
      GetFilesTask,
      ShowPlugmaPromptTask,
      BuildManifestTask,
      BuildUiTask,
      BuildMainTask,
      StartViteServerTask,
      RestartViteServerTask,
      StartWebSocketsServerTask,
    )(pluginOptions);

    log.success('Development server started successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to start development server:', errorMessage);
    throw error;
  }
}
