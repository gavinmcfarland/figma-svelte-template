import { beforeEach, describe, expect, test, vi } from 'vitest';
import { serial } from '../tasks/runner.js';
import { dev } from './dev.js';

vi.mock('../tasks/runner.js', () => ({
  serial: vi.fn(),
}));

describe('Dev Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options = { debug: false, command: 'dev' as const };
      await dev(options);

      expect(serial).toHaveBeenCalledWith(
        [
          'common:get-files',
          'common:show-plugma-prompt',
          'build:manifest',
          'build:ui',
          'build:main',
          'server:start-vite',
          'server:websocket',
        ],
        expect.objectContaining({
          ...options,
          mode: 'development',
          output: 'dist',
          instanceId: expect.any(String),
          port: expect.any(Number),
        }),
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockRejectedValueOnce(error);

      const options = { debug: false, command: 'dev' as const };
      await expect(dev(options)).rejects.toThrow(error);
    });
  });
});
