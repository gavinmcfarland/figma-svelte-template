import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import type { InlineConfig } from 'vite';
import { createServer } from 'vite';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';
import { viteState } from './vite.js';

/**
 * Result type for the restart-vite-server task
 */
export interface RestartViteServerResult {
  server: import('vite').ViteDevServer | null;
}

/**
 * Task to restart the Vite server
 */
export const restartViteServer = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<RestartViteServerResult> => {
  try {
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files, config } = fileResult;

    // Skip if no UI is specified
    if (!files.manifest?.ui) {
      return { server: null };
    }

    // Close existing server if any
    if (viteState.viteServer) {
      await viteState.viteServer.close();
    }

    // Create and start new server
    const server = await createServer(config.ui as InlineConfig);
    await server.listen();
    viteState.viteServer = server;
    return { server };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to start Vite server');
  }
};

export const RestartViteServerTask = task(
  'server:restart-vite',
  restartViteServer,
);

export type RestartViteServerTask = GetTaskTypeFor<
  typeof RestartViteServerTask
>;

export default RestartViteServerTask;
