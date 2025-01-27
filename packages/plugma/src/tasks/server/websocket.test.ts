import type { ResultsOfTask } from '#core/types.js';
import { type MockFs, createMockFs } from '#tests/utils/mock-fs.js';
import { createMockGetFilesResult } from '#tests/utils/mock-get-files.js';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { GetFilesTask } from '../common/get-files.js';
import { StartWebSocketsServerTask } from './websocket.js';

vi.mock('ws', () => ({
  WebSocketServer: vi.fn(),
}));

vi.mock('#utils/cleanup.js');

interface MockWebSocketClient extends EventEmitter {
  readyState: number;
  OPEN: number;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

class MockWebSocketServer extends EventEmitter {
  clients: Set<MockWebSocketClient>;
  close: ReturnType<typeof vi.fn>;
  options: Record<string, unknown>;
  path: string;
  address: () => { port: number };
  handleUpgrade: ReturnType<typeof vi.fn>;
  shouldHandle: ReturnType<typeof vi.fn>;

  constructor() {
    super();
    this.clients = new Set();
    this.close = vi.fn().mockResolvedValue(undefined);
    this.options = {};
    this.path = '';
    this.address = () => ({ port: 3003 });
    this.handleUpgrade = vi.fn();
    this.shouldHandle = vi.fn();

    this.on('connection', (client: MockWebSocketClient) => {
      this.clients.add(client);
      client.on('close', () => {
        this.clients.delete(client);
      });
      client.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          client.send(JSON.stringify({ type: 'response', data: message }));
        } catch (error) {
          // Invalid JSON
        }
      });
    });
  }
}

class MockWebSocketClientImpl
  extends EventEmitter
  implements MockWebSocketClient
{
  readyState = 1;
  OPEN = 1;
  send = vi.fn();
  close = vi.fn();
}

describe('WebSocket Server Tasks', () => {
  let mockFs: MockFs;
  let mockServer: MockWebSocketServer;
  let mockClient: MockWebSocketClient;

  const baseOptions = {
    command: 'dev' as const,
    mode: 'development',
    port: 3002,
    output: 'dist',
    instanceId: 'test',
    debug: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = createMockFs();
    mockServer = new MockWebSocketServer();
    mockClient = new MockWebSocketClientImpl();
    vi.mocked(WebSocketServer).mockImplementation(
      () => mockServer as unknown as WebSocketServer,
    );
  });

  describe('StartWebSocketsServerTask', () => {
    it('should start WebSocket server with correct configuration', async () => {
      const context: ResultsOfTask<typeof GetFilesTask> = {
        [GetFilesTask.name]: createMockGetFilesResult(),
      };

      const result = await StartWebSocketsServerTask.run(baseOptions, context);

      expect(WebSocketServer).toHaveBeenCalledWith({
        port: 3003,
      });
      expect(result.server).toBe(mockServer);
    });

    it('should handle client connection and messages', async () => {
      const result = await StartWebSocketsServerTask.run(baseOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });
      const mockClient = new MockWebSocketClientImpl();

      result.server.emit('connection', mockClient);
      mockClient.emit('message', Buffer.from(JSON.stringify({ type: 'test' })));

      expect(result.server.clients.size).toBe(1);
      expect(mockClient.send).toHaveBeenCalled();
    });

    it('should handle client disconnection', async () => {
      const result = await StartWebSocketsServerTask.run(baseOptions, {
        [GetFilesTask.name]: createMockGetFilesResult(),
      });
      const mockClient = new MockWebSocketClientImpl();

      result.server.emit('connection', mockClient);
      mockClient.emit('close');

      expect(result.server.clients.size).toBe(0);
    });
  });
});
