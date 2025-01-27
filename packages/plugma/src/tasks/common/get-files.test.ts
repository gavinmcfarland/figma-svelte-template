import { type MockFs, createMockFs } from '#tests/utils/mock-fs.js';
import { createMockViteConfig } from '#tests/utils/mock-vite-config.js';
import { createViteConfigs } from '#utils/config/create-vite-configs.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetFilesTask } from './get-files.js';

vi.mock('node:fs', () => {
  const mockFs = {
    readFileSync: vi
      .fn()
      .mockReturnValue('//>> PLACEHOLDER : runtimeData <<//'),
  };
  return {
    ...mockFs,
    default: mockFs,
  };
});

vi.mock('#utils', () => ({
  readJson: vi.fn(),
  getDirName: () => '/mock/dir',
  writeTempFile: vi.fn().mockReturnValue('/mock/temp/file.js'),
}));

vi.mock('#utils/config/create-vite-configs.js', () => ({
  createViteConfigs: vi.fn(),
}));

vi.mock('#utils/config/get-user-files.js', () => ({
  getUserFiles: vi.fn(),
}));

describe('get-files Task', () => {
  let mockFs: MockFs;
  const mockConfig = createMockViteConfig();

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  const baseContext = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
  });

  describe('Task Definition', () => {
    it('should have correct name', () => {
      expect(GetFilesTask.name).toBe('common:get-files');
    });
  });

  describe('Task Execution', () => {
    it('should load files and create configs successfully', async () => {
      const { readJson } = await import('#utils');
      const { getUserFiles } = await import('#utils/config/get-user-files.js');
      const mockPackageJson = {
        name: 'test-plugin',
        version: '1.0.0',
        plugma: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            main: 'src/main.ts',
            ui: 'src/ui.tsx',
            version: '1.0.0',
          },
        },
      };

      const mockManifest = mockPackageJson.plugma.manifest;

      vi.mocked(readJson).mockImplementation(async (path) => {
        if (path.endsWith('manifest.json')) {
          throw new Error('File not found');
        }
        return mockPackageJson;
      });

      vi.mocked(getUserFiles).mockResolvedValue({
        manifest: mockManifest,
        userPkgJson: mockPackageJson,
      });

      vi.mocked(createViteConfigs).mockReturnValue(mockConfig);

      const result = await GetFilesTask.run(baseOptions, baseContext);

      // Verify version and files structure
      expect(result.version).toBe(mockPackageJson.version);
      expect(result.files).toEqual({
        manifest: mockManifest,
        userPkgJson: mockPackageJson,
      });

      // Verify key parts of the config
      expect(result.config.ui.dev.mode).toBe('development');
      expect(result.config.ui.dev.server?.port).toBe(3000);
      expect(result.config.ui.build.build?.outDir).toBe('dist');
      expect(result.config.main.dev.mode).toBe('development');
      expect(result.config.main.build.mode).toBe('development');
    });

    it('should throw error when package.json is missing', async () => {
      const { readJson } = await import('#utils');
      const { getUserFiles } = await import('#utils/config/get-user-files.js');

      vi.mocked(readJson).mockRejectedValue(new Error('File not found'));
      vi.mocked(getUserFiles).mockRejectedValue(new Error('File not found'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        'File not found',
      );
    });

    it('should throw error when package.json is invalid', async () => {
      const { readJson } = await import('#utils');
      const { getUserFiles } = await import('#utils/config/get-user-files.js');

      vi.mocked(readJson).mockRejectedValue(new Error('Unexpected token'));
      vi.mocked(getUserFiles).mockRejectedValue(new Error('Unexpected token'));

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        'Unexpected token',
      );
    });

    it('should handle getUserFiles error', async () => {
      const { readJson } = await import('#utils');
      const { getUserFiles } = await import('#utils/config/get-user-files.js');
      const mockPackageJsonWithoutMain = {
        name: 'test-plugin',
        version: '1.0.0',
        plugma: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            version: '1.0.0',
          },
        },
      };

      vi.mocked(readJson).mockResolvedValue(mockPackageJsonWithoutMain);
      vi.mocked(getUserFiles).mockRejectedValue(
        new Error('No main or UI file specified'),
      );

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        'No main or UI file specified',
      );
    });

    it('should handle createConfigs error', async () => {
      const { readJson } = await import('#utils');
      const { getUserFiles } = await import('#utils/config/get-user-files.js');
      const mockPackageJson = {
        name: 'test-plugin',
        version: '1.0.0',
        plugma: {
          manifest: {
            name: 'Test Plugin',
            id: 'test-plugin',
            api: '1.0.0',
            main: 'src/main.ts',
            ui: 'src/ui.tsx',
            version: '1.0.0',
          },
        },
      };

      vi.mocked(readJson).mockImplementation(async (path) => {
        if (path.endsWith('manifest.json')) {
          throw new Error('File not found');
        }
        return mockPackageJson;
      });

      vi.mocked(getUserFiles).mockResolvedValue({
        manifest: mockPackageJson.plugma.manifest,
        userPkgJson: mockPackageJson,
      });

      vi.mocked(createViteConfigs).mockImplementation(() => {
        throw new Error('Failed to create configs');
      });

      await expect(GetFilesTask.run(baseOptions, baseContext)).rejects.toThrow(
        'Failed to create configs',
      );
    });
  });
});
