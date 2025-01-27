import {
  mockMainBuildOptions,
  resetMocks,
  setupFsMocks,
  setupViteMock,
} from '#tests/utils/mock-build.js';
import { createMockBuildFs } from '#tests/utils/mock-fs.js';
import { createMockGetFilesResult } from '#tests/utils/mock-get-files.js';
import { createMockContext } from '#tests/utils/mock-task.js';
import { createMockViteServer } from '#tests/utils/mock-vite.js';
import { registerCleanup, unregisterCleanup } from '#utils/cleanup.js';
import { build } from 'vite';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { viteState } from '../server/vite.js';
import { BuildMainTask } from './main.js';

// Setup mocks
setupFsMocks();
setupViteMock();

vi.mock('#utils/cleanup.js', () => ({
  registerCleanup: vi.fn(),
  unregisterCleanup: vi.fn(),
}));

describe('Main Build Tasks', () => {
  describe('buildMain Task', () => {
    beforeEach(() => {
      resetMocks();
      viteState.viteBuild = null;
    });

    describe('Task Definition', () => {
      test('should have correct name', () => {
        expect(BuildMainTask.name).toBe('build:main');
      });
    });

    describe('Task Execution', () => {
      test('should build main script when main is specified', async () => {
        const fs = createMockBuildFs();
        const getFilesResult = createMockGetFilesResult({
          files: {
            manifest: {
              name: 'Test Plugin',
              id: 'test-plugin',
              version: '1.0.0',
              api: '1.0.0',
              main: 'src/plugin-main.ts',
            },
          },
        });

        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(mockMainBuildOptions, context);

        expect(build).toHaveBeenCalledWith(
          expect.objectContaining({
            root: process.cwd(),
            base: '/',
            mode: expect.any(String),
            build: expect.objectContaining({
              outDir: expect.any(String),
              emptyOutDir: true,
              sourcemap: true,
              minify: expect.any(Boolean),
              lib: expect.objectContaining({
                entry: 'src/plugin-main.ts',
                formats: ['iife'],
                name: 'plugin',
                fileName: expect.any(Function),
              }),
              rollupOptions: expect.objectContaining({
                input: 'src/plugin-main.ts',
                external: ['figma'],
                output: expect.objectContaining({
                  globals: expect.objectContaining({
                    figma: 'figma',
                  }),
                }),
              }),
            }),
          }),
        );
      });

      test('should skip build when main is not specified', async () => {
        const getFilesResult = createMockGetFilesResult({
          files: {
            manifest: {
              name: 'Test Plugin',
              id: 'test-plugin',
              version: '1.0.0',
              api: '1.0.0',
              // main is intentionally omitted
            },
          },
        });

        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(mockMainBuildOptions, context);

        expect(build).not.toHaveBeenCalled();
      });

      test('should close existing build server', async () => {
        const mockServer = createMockViteServer();
        viteState.viteBuild = mockServer;

        const getFilesResult = createMockGetFilesResult();
        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(mockMainBuildOptions, context);

        expect(mockServer.close).toHaveBeenCalled();
      });

      test('should register cleanup in dev/preview mode', async () => {
        const getFilesResult = createMockGetFilesResult();
        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(mockMainBuildOptions, context);

        expect(registerCleanup).toHaveBeenCalled();
        expect(unregisterCleanup).not.toHaveBeenCalled();
      });

      test('should unregister cleanup in build mode', async () => {
        const getFilesResult = createMockGetFilesResult();
        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(
          { ...mockMainBuildOptions, command: 'build' },
          context,
        );

        expect(registerCleanup).toHaveBeenCalled();
        expect(unregisterCleanup).toHaveBeenCalled();
      });

      test('should enable watch mode in dev/preview', async () => {
        const getFilesResult = createMockGetFilesResult();
        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await BuildMainTask.run(mockMainBuildOptions, context);

        expect(build).toHaveBeenCalledWith(
          expect.objectContaining({
            build: expect.objectContaining({
              watch: {},
            }),
          }),
        );
      });

      test('should handle missing get-files result', async () => {
        const context = createMockContext(mockMainBuildOptions, {});

        await expect(
          BuildMainTask.run(mockMainBuildOptions, context),
        ).rejects.toThrow('get-files task must run first');
      });

      test('should handle Vite build errors', async () => {
        const getFilesResult = createMockGetFilesResult();
        vi.mocked(build).mockRejectedValueOnce(new Error('Build failed'));

        const context = createMockContext(mockMainBuildOptions, {
          [GetFilesTask.name]: getFilesResult,
        });

        await expect(
          BuildMainTask.run(mockMainBuildOptions, context),
        ).rejects.toThrow('Failed to build main script: Build failed');
      });
    });
  });
});
