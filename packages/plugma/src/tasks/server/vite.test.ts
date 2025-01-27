import { type MockFs, createMockFs } from '#tests/utils/mock-fs.js';
import { createMockGetFilesResult } from '#tests/utils/mock-get-files.js';
import { createMockViteServer } from '#tests/utils/mock-vite.js';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { StartViteServerTask, viteState } from './vite.js';

vi.mock('vite', () => ({
  createServer: vi.fn(),
}));

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: vi.fn(),
}));

describe('Vite Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: ViteDevServer;

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mockServer = createMockViteServer();
    vi.mocked(createServer).mockResolvedValue(mockServer);
  });

  describe('startViteServer Task', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      viteState.viteServer = null;
    });

    describe('Task Definition', () => {
      it('should have correct name', () => {
        expect(StartViteServerTask.name).toBe('server:start-vite');
      });
    });

    describe('Task Execution', () => {
      it('should start Vite server with correct configuration', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        const result = await StartViteServerTask.run(baseOptions, context);

        expect(result.server).toBe(mockServer);
        expect(createServer).toHaveBeenCalledWith(
          expect.objectContaining({
            server: expect.objectContaining({
              port: 3000,
              strictPort: true,
              host: 'localhost',
              cors: true,
              middlewareMode: false,
              sourcemapIgnoreList: expect.any(Function),
            }),
          }),
        );
        expect(mockServer.listen).toHaveBeenCalled();
      });

      it('should close existing server', async () => {
        const existingServer = createMockViteServer();
        viteState.viteServer = existingServer;

        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await StartViteServerTask.run(baseOptions, context);

        expect(existingServer.close).toHaveBeenCalled();
        expect(createServer).toHaveBeenCalled();
        expect(mockServer.listen).toHaveBeenCalled();
      });

      it('should handle server start errors', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        vi.mocked(mockServer.listen).mockRejectedValueOnce(
          new Error('Listen failed'),
        );

        await expect(
          StartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('Listen failed');
      });
    });
  });
});
