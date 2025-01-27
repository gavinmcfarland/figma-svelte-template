import type { ResultsOfTask } from '#core/task-runner/types.js';
import {
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
  setupViteMock,
} from '#tests/utils/mock-build.js';
import {
  createMockGetFilesResult,
  createMockGetFilesResultWithoutUi,
} from '#tests/utils/mock-get-files.js';
import { createMockViteServer } from '#tests/utils/mock-server.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { viteState } from '../server/vite.js';
import { BuildUiTask } from './ui.js';

// Setup mocks
setupFsMocks();
setupViteMock();

describe('UI Build Task', () => {
  beforeEach(() => {
    resetMocks();
  });

  test('should build UI when UI is specified', async () => {
    const { build: viteBuild } = await import('vite');

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    const result = await BuildUiTask.run(mockBuildOptions, context);

    // Verify output path
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify Vite build was called with correct config
    expect(viteBuild).toHaveBeenCalledWith({
      root: process.cwd(),
      base: '/',
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
        rollupOptions: {
          input: 'src/ui.tsx',
          output: {
            entryFileNames: 'ui.js',
            format: 'iife',
          },
        },
      },
    });
  });

  test('should skip UI build when UI is not specified', async () => {
    const { build: viteBuild } = await import('vite');

    const context = {
      [GetFilesTask.name]: createMockGetFilesResultWithoutUi(),
    };

    const result = await BuildUiTask.run(mockBuildOptions, context);

    // Verify output path is still returned
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify Vite build was not called
    expect(viteBuild).not.toHaveBeenCalled();
  });

  test('should close existing UI server', async () => {
    const mockServer = createMockViteServer();
    viteState.viteUi = mockServer;

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await BuildUiTask.run(mockBuildOptions, context);

    // Verify server was closed
    expect(mockServer.close).toHaveBeenCalled();
  });

  test('should handle missing get-files result', async () => {
    const context = {} as ResultsOfTask<GetFilesTask>;

    await expect(BuildUiTask.run(mockBuildOptions, context)).rejects.toThrow(
      'get-files task must run first',
    );
  });

  test('should handle Vite build errors', async () => {
    const { build: viteBuild } = await import('vite');

    // Mock Vite build to fail
    vi.mocked(viteBuild).mockRejectedValue(new Error('Build failed'));

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await expect(BuildUiTask.run(mockBuildOptions, context)).rejects.toThrow(
      'Failed to build UI',
    );
  });
});
