//@index(['./*.ts', './*/index.ts'], f => `export * from '${f.path}.js';`)
export * from '../task-runner/task-runner.js';
export * from '../task-runner/types.js';
//@endindex

/**
 * Task runner implementation
 */

import type { CommandName } from '#commands/types.js';
import type {
  RegisterableTask,
  TaskContext,
  TaskDefinition,
  TaskName,
  TaskResult,
} from '../task-runner/types.js';
import type { PluginOptions } from '../types.js';

const taskRegistry = new Map<TaskName, TaskDefinition<unknown>>();

/**
 * Registers a task in the task registry
 * @param task - The task definition to register
 * @throws {Error} If a task with the same name is already registered
 */
export function registerTask<TResult, TCommand extends CommandName>(
  task: RegisterableTask<TCommand>,
): void {
  if (taskRegistry.has(task.name)) {
    throw new Error(`Task "${task.name}" is already registered`);
  }
  taskRegistry.set(task.name, task);
}

/**
 * Helper function to safely get a task result with proper typing
 * @param results - Record of task results
 * @param task - Task definition to get result for
 * @returns The task result if available, undefined otherwise
 */
export function getTaskResult<T extends TaskDefinition<unknown>>(
  results: Record<TaskName, unknown>,
  task: T,
): TaskResult<T> | undefined {
  return results[task.name] as TaskResult<T>;
}

/**
 * Helper function to check if a task supports a command
 * @param task - Task definition to check
 * @param command - Command to check support for
 * @returns Whether the task supports the command
 */
function isTaskCommandSupported<TCommand extends CommandName>(
  task: TaskDefinition<unknown>,
  command: TCommand,
): task is TaskDefinition<unknown, TCommand> {
  if (!task.supportedCommands) {
    // If no supported commands are specified, assume it supports all commands
    return true;
  }
  return task.supportedCommands.includes(command as any);
}

/**
 * Executes a sequence of tasks in order
 * @param taskNames - Array of task names to execute
 * @param options - Plugin options to pass to tasks
 * @returns Record of task results
 * @throws {Error} If a task is not found or if a task execution fails
 */
export async function serial<TCommand extends CommandName>(
  taskNames: TaskName[],
  options: PluginOptions & { command: TCommand },
): Promise<Record<TaskName, unknown>> {
  const results: Record<TaskName, unknown> = {};

  for (const name of taskNames) {
    const task = taskRegistry.get(name);
    if (!task) {
      throw new Error(
        `Task "${name}" not found. Make sure to register it first.`,
      );
    }

    // Check if task supports the current command
    if (!isTaskCommandSupported(task, options.command)) {
      throw new Error(
        `Task "${name}" does not support the "${options.command}" command`,
      );
    }

    try {
      const context: TaskContext<TCommand> = {
        options: options as PluginOptions & { command: TCommand },
        results,
      };
      results[name] = await task.execute(context);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Task "${name}" failed: ${errorMessage}`);
    }
  }

  return results;
}

/**
 * Clears the task registry
 * Useful for testing or hot reloading
 */
export function clearTasks(): void {
  taskRegistry.clear();
}

/**
 * Gets all registered task names
 * @returns Array of registered task names
 */
export function getRegisteredTasks(): TaskName[] {
  return Array.from(taskRegistry.keys());
}
