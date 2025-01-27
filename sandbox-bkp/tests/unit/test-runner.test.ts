/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { test as plugmaTest } from '#testing/test-runner';
import { setupTestEnv, waitForMessage } from '../test-utils';
import { testCases } from '../__fixtures__/test-cases';

describe('test-runner.ts', () => {
  beforeEach(() => {
    const { ws } = setupTestEnv();
    return { ws };
  });

  describe('test function', () => {
    it('properly wraps Vitest test function', () => {
      const result = plugmaTest(testCases.basic.name, () => {});

      expect(result).toEqual({
        name: testCases.basic.name,
        fn: expect.any(Function),
        concurrent: false,
        sequential: true,
        only: false,
        skip: false,
        todo: false,
        fails: false,
        browserOnly: false,
      });
    });

    it('handles async test functions', async () => {
      const { ws } = setupTestEnv();
      const testPromise = plugmaTest(testCases.async.name, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const registerMessage = await waitForMessage(ws, 'REGISTER_TEST');
      expect(registerMessage.testName).toBe(testCases.async.name);
      expect(registerMessage.fnString).toMatch(/async/);
    });

    it('manages test timeouts correctly', async () => {
      const { ws } = setupTestEnv();
      vi.useFakeTimers();

      const testPromise = plugmaTest(testCases.timeout.name, async () => {
        await new Promise(resolve => setTimeout(resolve, 35000));
      });

      // Fast-forward past the timeout
      vi.advanceTimersByTime(31000);

      await expect(testPromise).rejects.toThrow(/timed out/);

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('handles test timeouts properly', async () => {
      const { ws } = setupTestEnv();
      vi.useFakeTimers();

      const testPromise = plugmaTest(testCases.timeout.name, async () => {
        await new Promise(resolve => setTimeout(resolve, 35000));
      });

      // Fast-forward past the timeout
      vi.advanceTimersByTime(31000);

      await expect(testPromise).rejects.toThrow(/timed out/);

      const cancelMessage = await waitForMessage(ws, 'CANCEL_TEST');
      expect(cancelMessage.reason).toBe('timeout');

      vi.useRealTimers();
    });

    it('provides detailed error messages', async () => {
      const { ws } = setupTestEnv();
      const testPromise = plugmaTest(testCases.error.name, () => {
        throw new Error('Custom test error');
      });

      await expect(testPromise).rejects.toThrow(/Custom test error/);

      const errorMessage = await waitForMessage(ws, 'TEST_ERROR');
      expect(errorMessage.error).toMatch(/Custom test error/);
      expect(errorMessage.originalError?.stack).toBeDefined();
    });

    it('preserves stack traces', async () => {
      const { ws } = setupTestEnv();
      const testPromise = plugmaTest(testCases.error.name, () => {
        throw new Error('Error with stack');
      });

      try {
        await testPromise;
      } catch (error) {
        expect(error.stack).toMatch(/Error with stack/);
        expect(error.stack).toMatch(/test-runner\.test\.ts/);
      }
    });

    it('includes plugin state in errors', async () => {
      const { ws } = setupTestEnv();
      const testPromise = plugmaTest(testCases.error.name, () => {
        throw new Error('Error with state');
      });

      try {
        await testPromise;
      } catch (error) {
        const errorMessage = await waitForMessage(ws, 'TEST_ERROR');
        expect(errorMessage.pluginState).toBeDefined();
        expect(errorMessage.pluginState).toHaveProperty('nodes');
        expect(errorMessage.pluginState).toHaveProperty('selection');
      }
    });
  });
});
