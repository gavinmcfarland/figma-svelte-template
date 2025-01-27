/**
 * Core types for the task runner system
 */

import type {
  BuildCommandOptions,
  CommandName,
  DevCommandOptions,
  ReleaseCommandOptions,
} from '#commands/types.js';
import type { PluginOptions } from '../types.js';

/**
 * Base interface for defining a task with its name, options, and results
 */
export interface TaskDefinition<
  TName extends string,
  TOptions extends Record<string, unknown>,
  TResult extends Record<string, unknown>,
> {
  name: TName;
  execute: (context: TOptions) => Promise<TResult>;
}

/**
 * Utility type to extract the task type from a task creator function
 */
export type GetTaskTypeFor<
  T extends { name: string; handler: (options: any) => any },
> = {
  name: T['name'];
  options: Parameters<T['handler']>[0];
  results: Awaited<ReturnType<T['handler']>>;
  handler: T['handler'];
};

/**
 * Creates a registry type that maps task names to their options and results
 */
export type MakeTaskRegistry<Tasks extends TaskDefinition<string, any, any>> = {
  [T in Tasks as T['name']]: {
    options: T['options'];
    results: T['results'];
  };
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
  supportedCommands?: CommandName[];
  execute: (context: TaskContext<TCommand>) => Promise<unknown>;
}

/**
 * Helper type to extract the results type from a task definition
 */
export type TaskResult<T extends TaskDefinition<string, any, any>> =
  T['results'];

/**
 * Task name type alias
 */
export type TaskName = string;

/**
 * Maps command names to their option types
 */
export interface CommandOptionsMap {
  dev: DevCommandOptions;
  preview: DevCommandOptions;
  build: BuildCommandOptions;
  release: ReleaseCommandOptions;
}

/**
 * Helper type to ensure a task supports the current command
 */
export type EnsureTaskSupportsCommand<
  T extends TaskDefinition<any, any, any>,
  C extends CommandName,
> = T extends TaskDefinition<any, infer TC, any>
  ? C extends TC
    ? T
    : never
  : never;
