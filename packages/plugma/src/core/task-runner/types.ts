/**
 * Core types for the task runner system.
 * This module provides the foundational types for defining and executing tasks
 * in a type-safe, dependency-aware manner.
 */
import type { EmptyObject, Join, UnionToTuple } from 'type-fest';

/**
 * Utility type to convert a union of string literals to a comma-separated string literal type
 */
export type UnionToString<T extends string> =
  UnionToTuple<T> extends readonly string[]
    ? Join<UnionToTuple<T>, ', '>
    : never;

/**
 * Base interface for task definitions.
 * Tasks are the fundamental unit of work in the system, each with a unique name
 * and a handler function that performs the actual work.
 *
 * @property name - Unique identifier for the task
 * @property handler - Function that executes the task's logic
 *
 * @example
 * ```typescript
 * const myTask: TaskDef = {
 *   name: 'build',
 *   handler: async (options: { mode: 'dev' | 'prod' }) => {
 *     // Task implementation
 *   }
 * };
 * ```
 */
export type TaskDef<Options = any, Context = any, Results = any> = {
  name: string;
  handler: (options: Options, context?: Context) => Promise<Results>;
};

/**
 * Represents a task that has been registered and can be run.
 */
export type RegisteredTask<
  Name extends string,
  TOptions,
  TResults,
  TContext,
> = {
  name: Name;
  run: (options: TOptions, context: TContext) => Promise<TResults>;
  supportedCommands?: string[];
};

/**
 * Extracts and infers the complete type information from a task definition.
 * This utility type is crucial for maintaining type safety throughout the task system
 * by providing access to the exact types of a task's name, options, context, and results.
 *
 * @template T - A type that extends TaskDef
 *
 * @property name - The literal type of the task's name
 * @property options - The type of the first parameter of the handler function
 * @property context - The type of the second parameter of the handler function
 * @property results - The resolved return type of the handler function
 * @property handler - The type of the handler function itself
 *
 * @example
 * ```typescript
 * const buildTask = {
 *   name: 'build' as const,
 *   handler: async (options: { mode: 'dev' | 'prod' }, context: { env: string }) => ({ success: true })
 * };
 *
 * type BuildTask = GetTaskTypeFor<typeof buildTask>;
 * // Results in:
 * // {
 * //   name: 'build'
 * //   options: { mode: 'dev' | 'prod' }
 * //   context: { env: string }
 * //   results: { success: boolean }
 * //   handler: (options: { mode: 'dev' | 'prod' }, context: { env: string }) => Promise<{ success: boolean }>
 * // }
 * ```
 */
export type GetTaskTypeFor<T extends RegisteredTask<any, any, any, any>> = {
  name: T extends { name: infer N } ? N : never;
  options: Parameters<T['run']>[0];
  context: Parameters<T['run']>[1] extends {
    [K in keyof Parameters<T['run']>[1]]: any;
  }
    ? Parameters<T['run']>[1]
    : {};
  results: Awaited<ReturnType<T['run']>>;
  handler: T['run'];
};

/**
 * Maps each task to its results type, creating a type-safe dictionary of task results.
 * This type is essential for managing task dependencies and ensuring that tasks
 * receive the correct result types from their dependencies.
 *
 * @template T - A Task type or a union of Task types
 *
 * @example
 * ```typescript
 * type Tasks = BuildTask | TestTask | DeployTask;
 * type AllResults = ResultsOfTask<Tasks>;
 * // Results in:
 * // {
 * //   'build': { success: boolean }
 * //   'test': { passed: boolean; coverage: number }
 * //   'deploy': { url: string }
 * // }
 * ```
 */
export type ResultsOfTask<
  T extends TaskDef | RegisteredTask<any, any, any, any>,
> = {
  [K in T['name']]: Extract<T, { name: K }> extends infer Task
    ? Task extends TaskDef
      ? Task['handler'] extends (...args: any[]) => Promise<infer R>
        ? R
        : never
      : Task extends RegisteredTask<any, any, any, any>
        ? Task['run'] extends (...args: any[]) => Promise<infer R>
          ? R
          : never
        : never
    : never;
};

/**
 * Generates a type error message when task dependencies are not satisfied.
 * Used internally by ValidateTaskOrder to provide clear error messages about missing dependencies.
 *
 * @template Name - The name of the task that has unsatisfied dependencies
 * @template Missing - The names of the missing dependency tasks
 */
type TaskDependencyError<
  Name extends string,
  Missing extends string,
> = `Task '${Name}' must come after tasks: ${UnionToString<Missing>}`;

/**
 * Validates that tasks are ordered correctly based on their context dependencies.
 * This type ensures that tasks are executed in an order that satisfies their dependencies,
 * preventing runtime errors from missing context data.
 *
 * @template Names - Tuple of task names in their execution order
 * @template T - The task definition type
 * @template Acc - Accumulator of validated task names (internal use)
 *
 * @example
 * ```typescript
 * // Valid order - buildTask doesn't depend on any other tasks
 * //               testTask depends on buildTask
 * //               deployTask depends on both buildTask and testTask
 * type ValidOrder = ValidateTaskOrder<['build', 'test', 'deploy'], Tasks>;
 *
 * // Invalid order - will result in a type error because testTask needs buildTask's results
 * type InvalidOrder = ValidateTaskOrder<['test', 'build', 'deploy'], Tasks>;
 * // Error: Task 'test' must come after tasks: build
 * ```
 */
export type ValidateTaskOrder<
  Names extends readonly string[],
  T extends TaskDef | RegisteredTask<any, any, any, any>,
  Acc extends string = never,
> = Names extends []
  ? never
  : Names extends readonly [infer First extends string]
    ? T extends { name: First; context: infer Context }
      ? Context extends ResultsOfTask<infer TaskDeps>
        ? TaskDeps['name'] extends Acc
          ? Names
          : TaskDependencyError<First, Exclude<TaskDeps['name'], Acc>>
        : Names
      : Names
    : Names extends readonly [
          infer First extends string,
          ...infer Rest extends string[],
        ]
      ? T extends { name: First; context: infer Context }
        ? Context extends ResultsOfTask<infer TaskDeps>
          ? TaskDeps['name'] extends Acc
            ? Rest extends ValidateTaskOrder<Rest, T, Acc | First>
              ? Names
              : ValidateTaskOrder<Rest, T, Acc | First>
            : TaskDependencyError<First, Exclude<TaskDeps['name'], Acc>>
          : Rest extends ValidateTaskOrder<Rest, T, Acc | First>
            ? Names
            : ValidateTaskOrder<Rest, T, Acc | First>
        : never
      : never;

/**
 * Maps task names to their option types for a group of tasks, filtering out tasks that don't require options.
 * This type is essential for the task runner system as it:
 * 1. Ensures type safety when running multiple tasks by requiring only the necessary options
 * 2. Automatically filters out tasks that have empty options (EmptyObject) to avoid unnecessary configuration
 * 3. Preserves the exact mapping between task names and their specific option types
 *
 * @template T - The task definition type that extends TaskDef
 * @template Names - A tuple of task names that will be executed
 *
 * @example
 * ```typescript
 * // Given tasks:
 * // - taskA: requires { foo: string }
 * // - taskB: requires no options (EmptyObject)
 * // - taskC: requires { bar: number }
 *
 * type Options = TaskGroupOptions<Tasks, ['taskA', 'taskB', 'taskC']>;
 * // Results in: { taskA: { foo: string }, taskC: { bar: number } }
 * // Note: taskB is omitted since it requires no options
 * ```
 */
export type TaskGroupOptions<
  T extends RegisteredTask<any, any, any, any>,
  Names extends readonly T['name'][],
> = {
  [K in Names[number] as Extract<T, { name: K }>['run'] extends (
    options: infer O,
    ...args: any[]
  ) => any
    ? O extends EmptyObject
      ? never
      : K
    : never]: Extract<T, { name: K }>['run'] extends (
    options: infer O,
    ...args: any[]
  ) => any
    ? O
    : never;
};
