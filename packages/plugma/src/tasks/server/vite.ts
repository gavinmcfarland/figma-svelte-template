/**
 * Vite server task implementation
 */

import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the start-vite-server task
 */
export interface StartViteServerResult {
  server: ViteDevServer;
  port: number;
}

/**
 * Shared Vite server state to manage server instances
 */
export const viteState = {
  viteServer: null as ViteDevServer | null,
  viteBuild: null as ViteDevServer | null,
  viteUi: null as ViteDevServer | null,
};

/**
 * Task that starts the Vite development server
 * Only used in dev and preview commands
 */
export const startViteServer = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<StartViteServerResult> => {
  try {
    const log = new Logger({ debug: options.debug });

    // Get files from previous task
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files, config } = fileResult;

    // Close existing server if any
    if (viteState.viteServer) {
      await viteState.viteServer.close();
    }

    // Register cleanup handler
    registerCleanup(async () => {
      log.debug('Cleaning up Vite server...');
      if (viteState.viteServer) {
        await viteState.viteServer.close();
        viteState.viteServer = null;
        log.success('Vite server closed');
      }
    });

    // Configure Vite server
    const server = await createServer({
      root: process.cwd(),
      base: '/',
      server: {
        port: options.port, // Port is required in dev/preview commands
        strictPort: true,
        cors: true,
        host: 'localhost',
        middlewareMode: false,
        sourcemapIgnoreList: () => true,
        hmr: {
          port: options.port,
          protocol: 'ws',
        },
      },
      build: {
        outDir: options.output || 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false, // No minification in dev/preview
      },
      optimizeDeps: {
        entries: [files.manifest.ui || '', files.manifest.main || ''].filter(
          Boolean,
        ),
      },
    }).catch((error) => {
      throw new Error(`Failed to start Vite server: ${error.message}`);
    });

    // Start the server
    await server.listen().catch((error) => {
      throw new Error(`Failed to start Vite server: ${error.message}`);
    });
    const resolvedPort = server.config.server.port || options.port;

    log.debug(`Vite server running at http://localhost:${resolvedPort}`);

    // Store server instance
    viteState.viteServer = server;

    return {
      server,
      port: resolvedPort,
    };
  } catch (error) {
    // Re-throw the original error without wrapping it
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const StartViteServerTask = task('server:start-vite', startViteServer);
export type StartViteServerTask = GetTaskTypeFor<typeof StartViteServerTask>;

export default StartViteServerTask;
