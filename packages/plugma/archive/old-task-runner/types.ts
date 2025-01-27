/**
 * Core types for the task runner system
 */

import type { BuildCommandOptions, CommandName, DevCommandOptions, ReleaseCommandOptions } from '#commands/types.js';
import type { PluginOptions } from '../types.js';

/**
 * Base interface for task definitions
 */
export interface TaskDef {
  name: string;
  options: Record<string, unknown>;
  results: unknown;
  context?: Record<string, unknown>;
}

/**
 * Utility type to extract the task type from a task creator function
 */
export type GetTaskTypeFor<T extends TaskDef> = {
  name: T extends { name: infer N } ? N : never;
  options: T extends { options: infer O } ? O : never;
  results: T extends { results: infer R } ? R : never;
  context: T extends { context: infer C } ? C : never;
};

/**
 * Maps each task to its results type
 */
export type ResultsOfTask<T extends TaskDef> = {
  [K in T['name']]: Extract<T, { name: K }>['results'];
};

/**
 * Converts a union of string literals to a comma-separated string literal type
 */
export type UnionToString<T extends string> = T extends string
  ? string extends T
    ? string
    : T extends any
    ? T | UnionToString<Exclude<T, T>>
    : never;

/**
 * Type error message for task dependency validation
 */
type TaskDependencyError<Name extends string, Missing extends string> = `Task '${Name}' must come after tasks: ${UnionToString<Missing>}`;

/**
 * Validates that tasks are ordered correctly based on their context dependencies
 */
export type ValidateTaskOrder<
  Names extends readonly string[],
  T extends TaskDef,
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
    : Names extends readonly [infer First extends string, ...infer Rest extends string[]]
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
 * Maps task names to their option types for task groups
 */
export type TaskGroupOptions<T extends TaskDef, Names extends readonly T['name'][]> = {
  [K in Names[number] as Extract<T, { name: K }>['options'] extends Record<string, never>
    ? never
    : K]: Extract<T, { name: K }>['options'];
};

/**
 * Context passed to task execution functions
 */
export interface TaskContext<TCommand extends CommandName> {
  options: PluginOptions & { command: TCommand };
  results: Record<string, unknown>;
}

/**
 * A task that can be registered in the system
 */
export interface RegisterableTask<TCommand extends CommandName> {
  name: string;
  execute: (context: TaskContext<TCommand>) => Promise<unknown>;
}
