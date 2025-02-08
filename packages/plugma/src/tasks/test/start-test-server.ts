/**
 * Task to start and manage the test WebSocket server
 * Handles test communication between Node and Figma environments
 */

import type { GetTaskTypeFor, PluginOptions } from '#core/types.js';
import { testClient } from '#testing/test-client.js';
import { Logger } from '#utils/log/logger.js';
import { task } from '../runner.js';

/**
 * Result type for the startTestServer task
 */
export interface StartTestServerResult {
  /** The connected test client */
  client: typeof testClient;
}

/**
 * Starts the test WebSocket server and connects the test client
 * The WebSocket server itself is already running via ws-server.cts
 */
export const startTestServer = async (
  options: PluginOptions,
): Promise<StartTestServerResult> => {
  const log = new Logger({ debug: options.debug });

  try {
    log.info('Connecting test client to WebSocket server...');
    await testClient.connect();
    log.success('Test client connected successfully');

    return {
      client: testClient,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Failed to connect test client:', errorMessage);
    throw error;
  }
};

export const StartTestServerTask = task('test:start-server', startTestServer);
export type StartTestServerTask = GetTaskTypeFor<typeof StartTestServerTask>;

export default StartTestServerTask;
