/**
 * Test utilities for mocking servers
 */

import type { ViteDevServer } from 'vite';
import { type Mock, vi } from 'vitest';
import type { WebSocket, WebSocketServer } from 'ws';

/**
 * Creates a mock WebSocket server
 * @returns Mock WebSocket server
 */
export function createMockWsServer(): WebSocketServer {
  const clients = new Set<WebSocket>();

  const server = {
    clients,
    on: vi.fn(),
    close: vi.fn(async () => {
      clients.clear();
    }),
  } as unknown as WebSocketServer;

  // Setup default event handler
  (server.on as Mock).mockImplementation((event: string, handler: Function) => {
    if (event === 'connection') {
      const mockWs = createMockWebSocket();
      clients.add(mockWs);
      handler(mockWs);
    }
  });

  return server;
}

/**
 * Creates a mock WebSocket client
 * @returns Mock WebSocket client
 */
export function createMockWebSocket(): WebSocket {
  return {
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1, // WebSocket.OPEN
  } as unknown as WebSocket;
}

/**
 * Creates a mock Vite server for testing
 * @param options - Optional server configuration
 * @returns A mock Vite server
 */
export function createMockViteServer(
  options: Partial<ViteDevServer> = {},
): ViteDevServer {
  return {
    listen: vi.fn(),
    close: vi.fn(),
    config: { server: { port: 3000 } },
    middlewares: vi.fn(),
    httpServer: vi.fn(),
    watcher: vi.fn(),
    ws: vi.fn(),
    restart: vi.fn(),
    printUrls: vi.fn(),
    bindCLIShortcuts: vi.fn(),
    resolvedUrls: null,
    ...options,
  } as ViteDevServer;
}

/**
 * Creates a mock Vite server that emits file changes
 * @param onFileChange - Callback to handle file changes
 * @returns Mock Vite server
 */
export function createMockViteServerWithWatcher(
  initialOnFileChange: (file: string) => void,
): ViteDevServer {
  const server = createMockViteServer();
  let fileChangeHandler = initialOnFileChange;

  // Setup watcher
  (server.watcher as unknown as { on: Mock }).on.mockImplementation(
    (event: string, handler: (file: string) => void) => {
      if (event === 'change') {
        fileChangeHandler = handler;
      }
    },
  );

  return server;
}

/**
 * Creates a mock Vite server that fails to start
 * @param error - Error to throw
 * @returns Mock Vite server
 */
export function createMockFailingViteServer(
  error: Error | string,
): ViteDevServer {
  const server = createMockViteServer();
  (server.listen as Mock).mockRejectedValue(
    error instanceof Error ? error : new Error(error),
  );
  return server;
}

/**
 * Creates a mock WebSocket server for testing
 * @param options - Optional server configuration
 * @returns A mock WebSocket server
 */
export function createMockWebSocketServer(
  options: Partial<{
    on: (event: string, handler: (...args: any[]) => void) => void;
    close: (cb: () => void) => void;
    clients: Set<any>;
  }> = {},
) {
  return {
    on: vi.fn(),
    close: vi.fn((cb) => cb()),
    clients: new Set(),
    ...options,
  };
}
