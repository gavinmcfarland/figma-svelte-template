import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { registerCleanup } from '#utils/cleanup.js';
import { Logger } from '#utils/log/logger.js';
import { WebSocketServer } from 'ws';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the start-websockets-server task
 */
export interface StartWebSocketsServerResult {
  server: WebSocketServer;
  port: number;
}

/**
 * Task that starts the WebSocket server for plugin communication
 * Only used in dev and preview commands
 */
export const startWebSocketsServer = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<StartWebSocketsServerResult> => {
  try {
    const log = new Logger({ debug: options.debug });

    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error(
        "Cannot destructure property 'files' of 'context.results[getFiles.name]' as it is undefined",
      );
    }

    const wsPort = options.port + 1;
    log.debug(`Starting WebSocket server on port ${wsPort}...`);

    // Create WebSocket server
    const wss = new WebSocketServer({ port: wsPort });

    // Handle server errors
    wss.on('error', () => {
      throw new Error('Server creation failed');
    });

    // Register cleanup handler
    registerCleanup(async () => {
      log.debug('Cleaning up WebSocket server...');
      await new Promise<void>((resolve) => {
        wss.close(() => {
          log.success('WebSocket server closed');
          resolve();
        });
      });
    });

    // Handle connections
    wss.on('connection', (ws) => {
      log.info('Client connected');

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          log.info('Received message:', message);

          // Broadcast message to all clients
          for (const client of wss.clients) {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(message));
            }
          }
        } catch (error) {
          log.error('Failed to parse message:', error);
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        log.info('Client disconnected');
      });

      // Handle errors
      ws.on('error', (error) => {
        log.error('WebSocket error:', error);
      });
    });

    log.success(`WebSocket server running on ws://localhost:${wsPort}`);

    return {
      server: wss,
      port: wsPort,
    };
  } catch (error) {
    // Re-throw the original error without wrapping it
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const StartWebSocketsServerTask = task(
  'server:websocket',
  startWebSocketsServer,
);
export type StartWebSocketsServerTask = GetTaskTypeFor<
  typeof StartWebSocketsServerTask
>;

export default StartWebSocketsServerTask;
