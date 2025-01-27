import type { ResultsOfTask } from '#core/task-runner/types.js';
import {
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
} from '#tests/utils/mock-build.js';
import {
  createMockGetFilesResult,
  createMockGetFilesResultWithoutUi,
} from '#tests/utils/mock-get-files.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { BuildPlaceholderUiTask } from './placeholder-ui.js';

// Setup mocks
setupFsMocks();

describe('Placeholder UI Task', () => {
  beforeEach(() => {
    resetMocks();
  });

  test('should create placeholder UI when UI is specified', async () => {
    const { writeFile, mkdir } = await import('node:fs/promises');

    // Mock fs operations
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    const result = await BuildPlaceholderUiTask.run(mockBuildOptions, context);

    // Verify output path
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify file operations
    expect(mkdir).toHaveBeenCalledWith('dist', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      'dist/ui.html',
      expect.stringContaining('Welcome to Your Plugma Plugin'),
      'utf-8',
    );
  });

  test('should skip placeholder UI when UI is not specified', async () => {
    const { writeFile, mkdir } = await import('node:fs/promises');

    // Mock fs operations
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);

    const context = {
      [GetFilesTask.name]: createMockGetFilesResultWithoutUi(),
    };

    const result = await BuildPlaceholderUiTask.run(mockBuildOptions, context);

    // Verify output path is still returned
    expect(result.outputPath).toBe('dist/ui.html');

    // Verify no file operations were performed
    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  test('should handle missing get-files result', async () => {
    const context = {} as ResultsOfTask<GetFilesTask>;

    await expect(
      BuildPlaceholderUiTask.run(mockBuildOptions, context),
    ).rejects.toThrow('get-files task must run first');
  });

  test('should handle fs errors', async () => {
    const { mkdir } = await import('node:fs/promises');

    // Mock fs operations to fail
    vi.mocked(mkdir).mockRejectedValue(new Error('Failed to create directory'));

    const context = {
      [GetFilesTask.name]: createMockGetFilesResult(),
    };

    await expect(
      BuildPlaceholderUiTask.run(mockBuildOptions, context),
    ).rejects.toThrow('Failed to build placeholder UI');
  });
});
