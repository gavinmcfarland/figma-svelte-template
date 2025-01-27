/**
 * Test utilities for mocking tasks and their results
 */

import type { RegisteredTask, ResultsOfTask } from '#core/task-runner/types.js';

/**
 * Creates a mock task with the given result
 * @param name - Name of the task
 * @param result - Result to return from the task
 * @returns A mock task definition
 */
export function createMockTask<TOptions = any, TResults = any, TContext = any>(
  name: string,
  result: TResults,
): RegisteredTask<string, TOptions, TResults, TContext> {
  return {
    name,
    run: async () => result,
  };
}

/**
 * Creates a mock task context with the given options and results
 */
export function createMockContext<T extends Record<string, unknown>>(
  options: Record<string, unknown>,
  results?: T,
): ResultsOfTask<any> {
  return {
    ...results,
  } as ResultsOfTask<any>;
}

/**
 * Creates a mock task result with the given name and data
 */
export function createMockTaskResult<T>(
  taskName: string,
  data: T,
): ResultsOfTask<any> {
  return {
    [taskName]: data,
  } as ResultsOfTask<any>;
}

/**
 * Creates a mock task that fails with the given error
 * @param name - Name of the task
 * @param error - Error to throw
 * @returns A mock task definition that throws an error
 */
export function createMockFailingTask<
  TOptions = any,
  TResults = any,
  TContext = any,
>(
  name: string,
  error: Error | string,
): RegisteredTask<string, TOptions, TResults, TContext> {
  return {
    name,
    run: async () => {
      throw error instanceof Error ? error : new Error(error);
    },
  };
}

/**
 * Creates a mock task that tracks its execution
 * @param name - Name of the task
 * @param result - Result to return from the task
 * @returns A mock task definition with execution tracking
 */
export function createMockTrackedTask<
  TOptions = any,
  TResults = any,
  TContext = any,
>(
  name: string,
  result: TResults,
): RegisteredTask<string, TOptions, TResults, TContext> & {
  executionCount: number;
} {
  let executionCount = 0;

  const task: RegisteredTask<string, TOptions, TResults, TContext> & {
    executionCount: number;
  } = {
    name,
    run: async () => {
      executionCount++;
      return result;
    },
    get executionCount() {
      return executionCount;
    },
  };

  return task;
}
