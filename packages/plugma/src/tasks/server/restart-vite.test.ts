import { type MockFs, createMockFs } from '#tests/utils/mock-fs.js';
import { createMockGetFilesResult } from '#tests/utils/mock-get-files.js';
import { createMockViteServer } from '#tests/utils/mock-vite.js';
import type { ViteDevServer } from 'vite';
import { createServer } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { RestartViteServerTask } from './restart-vite.js';
import { viteState } from './vite.js';

vi.mock('vite', () => ({
  createServer: vi.fn(),
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
    viteState.viteServer = null;
  });

  describe('restartViteServer Task', () => {
    describe('Task Definition', () => {
      it('should have correct name', () => {
        expect(RestartViteServerTask.name).toBe('server:restart-vite');
      });
    });

    describe('Task Execution', () => {
      it('should restart Vite server when UI is specified', async () => {
        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        const result = await RestartViteServerTask.run(baseOptions, context);

        expect(result.server).toBe(mockServer);
        expect(createServer).toHaveBeenCalledWith(
          createMockGetFilesResult().config.ui,
        );
        expect(mockServer.listen).toHaveBeenCalled();
      });

      it('should close existing server before starting new one', async () => {
        const existingServer = createMockViteServer();
        viteState.viteServer = existingServer;

        const context = {
          [GetFilesTask.name]: createMockGetFilesResult(),
        };

        await RestartViteServerTask.run(baseOptions, context);

        expect(existingServer.close).toHaveBeenCalled();
        expect(createServer).toHaveBeenCalledWith(
          createMockGetFilesResult().config.ui,
        );
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
          RestartViteServerTask.run(baseOptions, context),
        ).rejects.toThrow('Listen failed');
      });
    });
  });
});
