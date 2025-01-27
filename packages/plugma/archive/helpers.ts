import type { Simplify } from 'type-fest';

import type {
  RegisteredTask,
  ValidateTaskOrder,
} from '../src/core/task-runner/types';

/**
 * Creates a strongly-typed task with a name and handler function
 */
export function task<
  TName extends string,
  TOptions = {},
  TResults = {},
  TContext = {},
>(
  name: TName,
  handler: (options: TOptions, context: TContext) => Promise<TResults>,
): RegisteredTask<TName, TOptions, TResults, TContext> {
  return {
    name,
    run: handler,
  };
}

export function serial<
  T extends RegisteredTask<any, any, any, any>,
  First extends T['name'],
  Rest extends T['name'][],
>(
  firstTask: [First, ...Rest] extends ValidateTaskOrder<[First, ...Rest], T>
    ? First
    : ValidateTaskOrder<[First, ...Rest], T>,
  ...otherTasks: Rest
): (
  options: Simplify<
    {
      tasks: Record<First | Rest[number], T>;
      context?: Record<string, unknown>;
    } & {
      [K in First | Rest[number]]?: T extends { name: K }
        ? Parameters<T['run']>[0]
        : never;
    }
  >,
) => Promise<Record<First | Rest[number], unknown>> {
  return async (options) => {
    const results: Record<string, unknown> = {};
    const tasks = [firstTask, ...otherTasks];

    for (const taskName of tasks) {
      const task = options.tasks[taskName];
      if (!task) {
        throw new Error(`Task "${taskName}" not found`);
      }

      results[taskName] = await task.run(
        options[taskName] || {},
        options.context || {},
      );
    }

    return results;
  };
}

export function parallel<T extends RegisteredTask<any, any, any, any>>(
  tasks: T['name'][],
): (
  options: Simplify<
    {
      tasks: Record<T['name'], T>;
      context?: Record<string, unknown>;
    } & {
      [K in T['name']]?: T extends { name: K }
        ? Parameters<T['run']>[0]
        : never;
    }
  >,
) => Promise<Record<T['name'], unknown>> {
  return async (options) => {
    const results: Record<string, unknown> = {};
    const taskPromises = tasks.map(async (taskName) => {
      const task = options.tasks[taskName];
      if (!task) {
        throw new Error(`Task "${taskName}" not found`);
      }

      results[taskName] = await task.run(
        options[taskName] || {},
        options.context || {},
      );
    });

    await Promise.all(taskPromises);
    return results;
  };
}
