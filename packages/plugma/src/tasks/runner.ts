import { TaskRunner, createHelpers } from '../core/task-runner/task-runner.js';
import type { RegisteredTask } from '../core/task-runner/types.js';

export type Task = RegisteredTask<any, any, any, any>;

// Create a singleton instance of the TaskRunner with our Task type
const taskRunner = new TaskRunner<Task>();

export const { log, task, run, serial, parallel } =
  createHelpers<Task>(taskRunner);
