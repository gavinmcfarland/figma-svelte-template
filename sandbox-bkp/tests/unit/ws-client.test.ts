/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestClient } from '../../ws-client';
import { setupTestEnv } from '../test-utils';
import { wsMessages } from '../__fixtures__/test-cases';

describe('ws-client.ts', () => {
  let testClient: TestClient;

  beforeEach(() => {
    vi.useFakeTimers();
    const { ws } = setupTestEnv();
    testClient = TestClient.getInstance();
    return { ws };
  });

  afterEach(() => {
    testClient.close();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('connection management', () => {
    it('establishes WebSocket connection', async () => {
      const { ws } = setupTestEnv();
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    it('handles connection errors', async () => {
      const { ws } = setupTestEnv();

      // Emit error
      ws.emit('error', new Error('Connection failed'));
      await vi.runAllTimersAsync();

      // Error should close the connection
      expect(ws.readyState).toBe(WebSocket.CLOSED);
    });

    it('manages connection state', async () => {
      const { ws } = setupTestEnv();

      // Test close
      testClient.close();
      await vi.runAllTimersAsync();
      expect(ws.readyState).toBe(WebSocket.CLOSED);

      // Test reconnection
      await testClient.send(wsMessages.register);
      await vi.runAllTimersAsync();
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('message handling', () => {
    it('sends messages correctly', async () => {
      const { ws } = setupTestEnv();
      const responsePromise = testClient.send(wsMessages.register);
      await vi.runAllTimersAsync();
      const response = await responsePromise;
      expect(response.type).toBe('REGISTER_TEST');
    });

    it('handles responses properly', async () => {
      const { ws } = setupTestEnv();
      const responsePromise = testClient.send(wsMessages.register);
      await vi.runAllTimersAsync();
      const response = await responsePromise;
      expect(response.pluginMessage.type).toBe('ASSERTIONS');
    });

    it('manages timeouts', async () => {
      const { ws } = setupTestEnv();
      const promise = testClient.send(wsMessages.register);
      await vi.advanceTimersByTimeAsync(31000);
      await expect(promise).rejects.toThrow('Request timed out');
    });

    it('cleans up resources', async () => {
      const { ws } = setupTestEnv();
      const promise = testClient.send(wsMessages.register);
      testClient.close();
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow('WebSocket closed');
    });
  });
});
