import { beforeEach, describe, expect, test, vi } from 'vitest';
import { serial } from '../tasks/runner.js';
import { preview } from './preview.js';

vi.mock('../tasks/runner.js', () => ({
  serial: vi.fn(),
}));

describe('Preview Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task Execution', () => {
    test('should execute tasks in correct order', async () => {
      const options = { debug: false, command: 'preview' as const };
      await preview(options);

      expect(serial).toHaveBeenCalledWith(
        [
          'common:get-files',
          'common:show-plugma-prompt',
          'build:manifest',
          'build:ui',
          'build:main',
          'server:websocket',
          'server:start-vite',
        ],
        expect.objectContaining({
          ...options,
          mode: 'preview',
          output: 'dist',
          instanceId: expect.any(String),
          port: expect.any(Number),
        }),
      );
    });

    test('should handle errors gracefully', async () => {
      const error = new Error('Task execution failed');
      vi.mocked(serial).mockRejectedValueOnce(error);

      const options = { debug: false, command: 'preview' as const };
      await expect(preview(options)).rejects.toThrow(error);
    });
  });
});
