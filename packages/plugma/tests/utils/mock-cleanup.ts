/**
 * Test utilities for mocking cleanup functionality
 */

import { vi } from 'vitest';

/**
 * Creates a mock cleanup handler
 * @returns Mock cleanup handler and tracking functions
 */
export function createMockCleanupHandler() {
  let cleanupCount = 0;
  let lastError: Error | null = null;

  const handler = vi.fn(async () => {
    cleanupCount++;
    if (lastError) {
      throw lastError;
    }
  });

  return {
    handler,
    setError: (error: Error) => {
      lastError = error;
    },
    clearError: () => {
      lastError = null;
    },
    getCleanupCount: () => cleanupCount,
    reset: () => {
      cleanupCount = 0;
      lastError = null;
      handler.mockClear();
    },
  };
}

/**
 * Creates a mock process with signal handling
 * @returns Mock process and signal emitter
 */
export function createMockProcess() {
  const handlers: Record<string, Function[]> = {
    SIGINT: [],
    SIGTERM: [],
    exit: [],
  };

  const mockProcess = {
    on: vi.fn((signal: string, handler: Function) => {
      handlers[signal] = handlers[signal] || [];
      handlers[signal].push(handler);
    }),
    off: vi.fn((signal: string, handler: Function) => {
      handlers[signal] = (handlers[signal] || []).filter((h) => h !== handler);
    }),
    exit: vi.fn((code = 0) => {
      for (const handler of handlers.exit) {
        handler(code);
      }
    }),
  };

  const emitSignal = async (signal: 'SIGINT' | 'SIGTERM') => {
    for (const handler of handlers[signal] || []) {
      await handler();
    }
  };

  return {
    process: mockProcess,
    emitSignal,
    getHandlerCount: (signal: string) => handlers[signal]?.length || 0,
    reset: () => {
      for (const key of Object.keys(handlers)) {
        handlers[key] = [];
      }
      mockProcess.on.mockClear();
      mockProcess.off.mockClear();
      mockProcess.exit.mockClear();
    },
  };
}

/**
 * Creates a mock cleanup registry
 * @returns Mock cleanup registry and tracking functions
 */
export function createMockCleanupRegistry() {
  const handlers = new Set<Function>();
  let cleanupCount = 0;

  const register = vi.fn((handler: Function) => {
    handlers.add(handler);
  });

  const unregister = vi.fn((handler: Function) => {
    handlers.delete(handler);
  });

  const runCleanup = async () => {
    cleanupCount++;
    for (const handler of handlers) {
      await handler();
    }
  };

  return {
    register,
    unregister,
    runCleanup,
    getHandlerCount: () => handlers.size,
    getCleanupCount: () => cleanupCount,
    reset: () => {
      handlers.clear();
      cleanupCount = 0;
      register.mockClear();
      unregister.mockClear();
    },
  };
}
