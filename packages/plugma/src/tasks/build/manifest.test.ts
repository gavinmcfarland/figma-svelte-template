import {
  mockBuildOptions,
  resetMocks,
  setupFsMocks,
} from '#tests/utils/mock-build.js';
import { createMockBuildFs } from '#tests/utils/mock-fs.js';
import { createMockGetFilesResult } from '#tests/utils/mock-get-files.js';
import { createMockContext } from '#tests/utils/mock-task.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GetFilesTask } from '../common/get-files.js';
import { BuildManifestTask } from './manifest.js';

// Setup mocks
setupFsMocks();

describe('build-manifest Task', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Task Definition', () => {
    test('should have correct name', () => {
      expect(BuildManifestTask.name).toBe('build:manifest');
    });
  });

  describe('Task Execution', () => {
    test('should build manifest successfully', async () => {
      const mockFs = createMockBuildFs();
      const { writeFile, mkdir } = await import('node:fs/promises');

      // Mock fs operations
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const context = createMockContext(mockBuildOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });

      const result = await BuildManifestTask.run(mockBuildOptions, context);

      // Verify manifest content
      expect(result).toEqual({
        raw: createMockGetFilesResult().files.manifest,
        processed: {
          name: 'Test Plugin',
          id: 'test-plugin',
          api: '1.0.0',
          main: 'main.js',
          ui: 'ui.html',
          version: '1.0.0',
        },
      });

      // Verify file operations
      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('dist'), {
        recursive: true,
      });
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('manifest.json'),
        expect.any(String),
        'utf-8',
      );
    });

    test('should handle missing get-files result', async () => {
      const context = createMockContext(mockBuildOptions);
      await expect(
        BuildManifestTask.run(mockBuildOptions, context),
      ).rejects.toThrow('get-files task must run first');
    });

    test('should handle missing main/ui files', async () => {
      const mockFs = createMockBuildFs();
      const { writeFile, mkdir } = await import('node:fs/promises');

      // Mock fs operations
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const mockGetFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            version: '1.0.0',
            main: 'main.js',
          },
          userPkgJson: {
            name: 'test-plugin',
            version: '1.0.0',
          },
        },
      });

      const context = createMockContext(mockBuildOptions, {
        [GetFilesTask.name]: mockGetFilesResult,
      });

      const result = await BuildManifestTask.run(mockBuildOptions, context);

      // Verify manifest content (should handle null/undefined)
      expect(result.processed).toEqual({
        name: 'Test Plugin',
        id: 'test-plugin',
        api: '1.0.0',
        version: '1.0.0',
        main: 'main.js',
      });
    });

    test('should handle fs errors', async () => {
      const { mkdir } = await import('node:fs/promises');

      // Mock fs operations to fail
      vi.mocked(mkdir).mockRejectedValue(
        new Error('Failed to create directory'),
      );

      const context = createMockContext(mockBuildOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });

      await expect(
        BuildManifestTask.run(mockBuildOptions, context),
      ).rejects.toThrow('Failed to build manifest');
    });

    test('should handle invalid manifest data', async () => {
      const mockFs = createMockBuildFs();
      const { writeFile, mkdir } = await import('node:fs/promises');

      // Mock fs operations
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      const mockGetFilesResult = createMockGetFilesResult({
        files: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            version: '1.0.0',
            main: 'src/main.ts',
          },
          userPkgJson: {
            name: 'test-plugin',
            version: '1.0.0',
          },
        },
      });

      const context = createMockContext(mockBuildOptions, {
        [GetFilesTask.name]: mockGetFilesResult,
      });

      const result = await BuildManifestTask.run(mockBuildOptions, context);

      // Verify manifest content (should handle null/undefined)
      expect(result.processed).toEqual({
        name: 'Test Plugin',
        id: 'test-plugin',
        api: '1.0.0',
        version: '1.0.0',
        main: 'main.js',
      });
    });
  });
});
