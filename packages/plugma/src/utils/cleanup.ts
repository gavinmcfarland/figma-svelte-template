/**
 * Cleanup utilities for task management
 */

import { Logger } from './log/logger.js';

type CleanupFn = () => Promise<void>;
const cleanupHandlers = new Set<CleanupFn>();
const log = new Logger();

/**
 * Registers a cleanup handler to be run on process exit
 * @param handler - Async function to run during cleanup
 */
export function registerCleanup(handler: CleanupFn): void {
  cleanupHandlers.add(handler);
}

/**
 * Removes a cleanup handler
 * @param handler - Handler to remove
 */
export function unregisterCleanup(handler: CleanupFn): void {
  cleanupHandlers.delete(handler);
}

/**
 * Runs all registered cleanup handlers
 */
export async function runCleanup(): Promise<void> {
  log.debug('Running cleanup handlers...');

  for (const handler of cleanupHandlers) {
    try {
      await handler();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error('Cleanup handler failed:', errorMessage);
    }
  }

  cleanupHandlers.clear();
  log.success('Cleanup complete');
}

// Register process cleanup
process.on('SIGINT', async () => {
  log.debug('\nReceived SIGINT. Cleaning up...');
  await runCleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.debug('Received SIGTERM. Cleaning up...');
  await runCleanup();
  process.exit(0);
});

process.on('exit', () => {
  // Note: 'exit' handlers must be synchronous, so we run cleanup sync
  for (const handler of cleanupHandlers) {
    try {
      // Convert async handler to sync using void
      void handler();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error('Cleanup handler failed:', errorMessage);
    }
  }
  cleanupHandlers.clear();
});
