import { beforeEach, describe, expect, test } from 'vitest';
import { TaskRunner } from './task-runner.js';
import type { RegisteredTask } from './types.js';

describe('Task Runner', () => {
  let taskRunner: TaskRunner<RegisteredTask<any, any, any, any>>;

  beforeEach(() => {
    taskRunner = new TaskRunner();
  });

  describe('Task Registration', () => {
    test('should register a task successfully', () => {
      const handler = async () => 'test result';
      const task = taskRunner.task('test-task', handler);

      expect(task.name).toBe('test-task');
      expect(task.run).toBe(handler);
    });

    test('should throw error when registering duplicate task', () => {
      const handler = async () => 'test result';
      taskRunner.task('test-task', handler);

      expect(() => taskRunner.task('test-task', handler)).toThrow(
        'already registered',
      );
    });
  });

  describe('Task Execution', () => {
    test('should execute tasks in sequence', async () => {
      const task1 = taskRunner.task(
        'task1',
        async (opt: {}, ctx: {}) => 'result1',
      );
      const task2 = taskRunner.task(
        'task2',
        async (_: {}, context: { task1: string }) => {
          expect(context.task1).toBe('result1');
          return 42;
        },
      );

      const results = await taskRunner.serial(task1, {}, task2);
      expect(results.task1).toBe('result1');
      expect(results.task2).toBe(42);
    });

    test('should handle task execution errors', async () => {
      const task = taskRunner.task('error-task', async () => {
        throw new Error('Task execution failed');
      });

      await expect(taskRunner.serial('error-task', {})).rejects.toThrow(
        'Task execution failed',
      );
    });
  });

  describe('Task Results', () => {
    test('should get task result with proper typing', async () => {
      interface TaskResult {
        value: number;
      }
      const task = taskRunner.task<'typed-task', unknown, unknown, TaskResult>(
        'typed-task',
        async () => ({ value: 42 }),
      );

      const results = await taskRunner.serial(task, {});
      expect((results.typed_task as TaskResult).value).toBe(42);
    });

    test('should return undefined for missing task result', () => {
      const results = {} as Record<string, unknown>;
      const result = results['missing-task'];
      expect(result).toBeUndefined();
    });
  });

  describe('Command Type Checking', () => {
    test('should execute task with matching command type', async () => {
      const task = taskRunner.task('dev-task', async () => 'dev result');

      const results = await taskRunner.serial('dev-task', {});
      expect(results.dev_task).toBe('dev result');
    });

    test('should throw error for incompatible command', async () => {
      const task = taskRunner.task('dev-task', async () => 'dev result');
      task.supportedCommands = ['dev'];

      await expect(
        taskRunner.serial('dev-task', { command: 'build' }),
      ).rejects.toThrow('does not support the "build" command');
    });

    test('should support multiple commands', async () => {
      const task = taskRunner.task('multi-task', async () => 'result');

      const devResults = await taskRunner.serial('multi-task', {});
      expect(devResults.multi_task).toBe('result');

      const previewResults = await taskRunner.serial('multi-task', {});
      expect(previewResults.multi_task).toBe('result');
    });

    test('should support all commands when supportedCommands is not specified', async () => {
      const task = taskRunner.task('all-task', async () => 'result');

      const devResults = await taskRunner.serial('all-task', {});
      expect(devResults.all_task).toBe('result');

      const buildResults = await taskRunner.serial('all-task', {});
      expect(buildResults.all_task).toBe('result');
    });
  });
});
