import { EventEmitter } from 'node:events';
import type { TestMessage } from '#testing/types';
import { wsMessages } from '../__fixtures__/test-cases';

/**
 * Mock WebSocket server for testing
 */
export class MockWebSocket extends EventEmitter {
  private static instance: MockWebSocket | null = null;
  private _readyState: number = WebSocket.CONNECTING;
  private _closed: boolean = false;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor(url: string) {
    super();
    // Immediately set to OPEN and emit open event
    this._readyState = WebSocket.OPEN;
    this.emit('open');
  }

  static getInstance(url: string): MockWebSocket {
    if (!MockWebSocket.instance || MockWebSocket.instance._closed) {
      MockWebSocket.instance = new MockWebSocket(url);
    }
    return MockWebSocket.instance;
  }

  static reset(): void {
    if (MockWebSocket.instance) {
      MockWebSocket.instance.close();
      MockWebSocket.instance = null;
    }
  }

  get readyState(): number {
    return this._readyState;
  }

  send(data: string): void {
    if (this._readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket closed');
    }

    try {
      const message = JSON.parse(data);
      const messageType = message.type;

      // Simulate response in next tick
      setTimeout(() => {
        if (this._readyState === WebSocket.OPEN) {
          if (messageType === 'REGISTER_TEST' || messageType === 'RUN_TEST') {
            this.emit('message', { data: JSON.stringify({ type: messageType, pluginMessage: { type: 'ASSERTIONS' } }) });
          }
        }
      }, 0);
    } catch (error) {
      this.emit('error', error);
    }
  }

  close(): void {
    this._readyState = WebSocket.CLOSED;
    this._closed = true;
    this.emit('close');
  }
}

// Replace global WebSocket with mock
declare global {
  var WebSocket: typeof MockWebSocket;
}
globalThis.WebSocket = MockWebSocket;
