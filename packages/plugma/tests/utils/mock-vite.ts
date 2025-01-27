import type { ResolvedConfig, ViteDevServer } from 'vite';
import { vi } from 'vitest';
import { createMockViteConfig } from './mock-vite-config.js';

/**
 * Creates a mock Vite dev server for testing.
 */
export function createMockViteServer(
  overrides: Partial<ViteDevServer> = {},
): ViteDevServer {
  const mockServer: ViteDevServer = {
    listen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    config: createMockViteConfig().ui.dev as unknown as ResolvedConfig,
    bindCLIShortcuts: vi.fn(),
    httpServer: null,
    middlewares: {} as any,
    printUrls: vi.fn(),
    resolvedUrls: null,
    restart: vi.fn(),
    watcher: {} as any,
    ws: {} as any,
    pluginContainer: {} as any,
    moduleGraph: {} as any,
    ssrLoadModule: async () => ({}),
    ssrFixStacktrace: () => {},
    ssrRewriteStacktrace: () => '',
    transformRequest: vi.fn().mockResolvedValue(null),
    warmupRequest: vi.fn().mockResolvedValue(null),
    transformIndexHtml: vi.fn().mockResolvedValue(''),
    ssrTransform: vi.fn().mockResolvedValue({ code: '' }),
    reloadModule: vi.fn(),
    openBrowser: vi.fn(),
  };

  return {
    ...mockServer,
    ...overrides,
  };
}
