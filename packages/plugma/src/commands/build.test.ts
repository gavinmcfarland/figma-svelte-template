import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BuildMainTask } from '../tasks/build/main.js';
import { BuildManifestTask } from '../tasks/build/manifest.js';
import { BuildUiTask } from '../tasks/build/ui.js';
import { GetFilesTask } from '../tasks/common/get-files.js';
import { ShowPlugmaPromptTask } from '../tasks/common/prompt.js';
import { serial } from '../tasks/runner.js';
import { StartViteServerTask } from '../tasks/server/vite.js';
import { StartWebSocketsServerTask } from '../tasks/server/websocket.js';
import { build } from './build.js';
import type { BuildCommandOptions } from './types.js';

vi.mock('../tasks/runner.js', () => ({
  serial: vi.fn(),
}));

describe('Build Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options: BuildCommandOptions = { debug: false, command: 'build' };
      await build(options);

      expect(serial).toHaveBeenCalledWith(
        [
          GetFilesTask.name,
          ShowPlugmaPromptTask.name,
          BuildManifestTask.name,
          BuildUiTask.name,
          BuildMainTask.name,
        ] as const,
        expect.objectContaining({
          ...options,
          mode: 'production',
          port: 3000,
          output: 'dist',
          instanceId: expect.any(String),
        }),
      );
    });

    test('should use provided options', async () => {
      const options: BuildCommandOptions = {
        debug: true,
        mode: 'development',
        output: 'build',
        command: 'build',
      };
      await build(options);

      expect(serial).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          ...options,
          port: 3000,
          instanceId: expect.any(String),
        }),
      );
    });

    test('should not start servers in build mode', async () => {
      await build({ debug: false, command: 'build' });

      const taskNames = vi.mocked(serial).mock.calls[0][0];
      expect(taskNames).not.toContain(StartViteServerTask.name);
      expect(taskNames).not.toContain(StartWebSocketsServerTask.name);
    });
  });

  describe('Error Handling', () => {
    test('should handle task execution errors', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockRejectedValueOnce(error);

      await expect(build({ debug: false, command: 'build' })).rejects.toThrow(
        error,
      );
    });
  });
});
