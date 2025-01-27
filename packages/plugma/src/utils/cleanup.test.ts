import { beforeEach, describe, expect, test, vi } from 'vitest';
import { registerCleanup, runCleanup, unregisterCleanup } from './cleanup.js';

// Mock process event handlers
vi.mock('node:process', () => ({
  on: vi.fn(),
}));

describe('Cleanup Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerCleanup', () => {
    test('should register cleanup handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registerCleanup(handler);
      await runCleanup();
      expect(handler).toHaveBeenCalled();
    });

    test('should not register duplicate handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registerCleanup(handler);
      registerCleanup(handler);
      await runCleanup();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterCleanup', () => {
    test('should unregister cleanup handler', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registerCleanup(handler);
      unregisterCleanup(handler);
      await runCleanup();
      expect(handler).not.toHaveBeenCalled();
    });

    test('should handle non-existent handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      unregisterCleanup(handler);
      await runCleanup();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cleanup process', () => {
    test('should execute all handlers on cleanup', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      registerCleanup(handler1);
      registerCleanup(handler2);
      await runCleanup();

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('should handle failed handlers', async () => {
      const handler1 = vi.fn().mockRejectedValue(new Error('Cleanup failed'));
      const handler2 = vi.fn().mockResolvedValue(undefined);

      registerCleanup(handler1);
      registerCleanup(handler2);
      await runCleanup();

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('should clear handlers after cleanup', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registerCleanup(handler);
      await runCleanup();
      await runCleanup(); // Run again
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

