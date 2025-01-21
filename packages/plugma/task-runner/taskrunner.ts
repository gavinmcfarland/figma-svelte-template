/**
 * Type definition for task options
 */
export type TaskOptions = Record<string, unknown>;

/**
 * Type definition for a task function
 */
type TaskFunction = (options: TaskOptions) => unknown;

/**
 * Type definition for a generator task function
 */
type GeneratorTaskFunction = (
  options: TaskOptions,
) => Generator<unknown, unknown, unknown>;

/**
 * Type definition for task name or callback
 */
type TaskNameOrCallback = string | TaskFunction;

/**
 * TaskRunner class for managing and executing tasks
 */
class TaskRunner {
  private tasks: Record<string, GeneratorTaskFunction>;
  private aliases: Record<string, string>;

  constructor() {
    this.tasks = {};
    this.aliases = {};
  }

  /**
   * Log a message to the console
   */
  log(message: string): void {
    console.log(message);
  }

  /**
   * Register a task with optional aliases
   * @param taskNames - Single task name or array of task names (first is primary, rest are aliases)
   * @param taskFn - Task function to execute (can be generator or normal function)
   */
  task(
    taskNames: string | string[],
    taskFn: TaskFunction | GeneratorTaskFunction,
  ): void {
    // If taskNames is a string, convert it to an array for consistency
    const namesArray = Array.isArray(taskNames) ? taskNames : [taskNames];
    const primaryTaskName = namesArray[0]; // The first element is the primary task name
    const aliasNames = namesArray.slice(1); // Remaining elements are treated as aliases

    // Register the primary task
    if (typeof taskFn === 'function') {
      if (taskFn.constructor.name === 'GeneratorFunction') {
        // Store generator functions directly
        this.tasks[primaryTaskName] = taskFn as GeneratorTaskFunction;
      } else {
        // Wrap normal functions in a generator
        this.tasks[primaryTaskName] = function* (options: TaskOptions) {
          yield taskFn(options); // Call the provided function and return its value
        };
      }
    } else {
      throw new Error('Task must be a function.');
    }

    // Register aliases if provided
    for (const alias of aliasNames) {
      this.aliases[alias] = primaryTaskName; // Map each alias to the primary task name
    }
  }

  /**
   * Run a single task by its name or alias or a callback function
   * @param taskNameOrCallback - Task name, alias, or callback function to execute
   * @param opts - Options to pass to the task
   * @returns Promise with the task result
   */
  async run(
    taskNameOrCallback: TaskNameOrCallback,
    opts: TaskOptions = {},
  ): Promise<unknown> {
    // Resolve task aliases
    const resolvedTaskName =
      typeof taskNameOrCallback === 'string'
        ? this.aliases[taskNameOrCallback] || taskNameOrCallback
        : taskNameOrCallback;

    if (typeof resolvedTaskName === 'string') {
      if (!this.tasks[resolvedTaskName]) {
        throw new Error(`Task "${resolvedTaskName}" not found`);
      }

      const taskFn = this.tasks[resolvedTaskName];
      const iterator = taskFn(opts); // Pass options as the first parameter
      let result = iterator.next();

      // Keep progressing through the generator until done
      while (!result.done) {
        result = iterator.next(result.value); // Synchronous flow for generators
      }

      return result.value; // Return the final result synchronously
    }

    if (typeof taskNameOrCallback === 'function') {
      // If it's a function, execute the callback and forward the options
      return await taskNameOrCallback(opts); // Forward options to the callback here
    }

    throw new Error(
      'Invalid argument: must be a task name (string) or callback (function).',
    );
  }

  /**
   * Run multiple tasks in series
   * @param taskNames - Array of task names to execute in series
   * @param opts - Options to pass to the tasks
   * @returns Promise with the final task result
   */
  async serial(taskNames: string[], opts: TaskOptions = {}): Promise<unknown> {
    let result: unknown;
    for (const name of taskNames) {
      result = await this.run(name, opts);
      if (result && typeof result === 'object') {
        Object.assign(opts, result); // Merge all properties returned by the task into opts
      }
    }
    return result;
  }

  /**
   * Run multiple tasks in parallel
   * @param taskNames - Array of task names to execute in parallel
   * @param opts - Options to pass to the tasks
   * @returns Promise with array of task results
   */
  async parallel(
    taskNames: string[],
    opts: TaskOptions = {},
  ): Promise<unknown[]> {
    const promises = taskNames.map((name) => this.run(name, opts)); // Run tasks concurrently
    return Promise.all(promises); // Wait for all promises to resolve
  }
}

// Create a singleton instance of the TaskRunner
const taskRunnerInstance = new TaskRunner();

// Expose the log function directly from the instance
export const log = taskRunnerInstance.log.bind(taskRunnerInstance);

// Export individual functions from the task runner instance
export const task = taskRunnerInstance.task.bind(taskRunnerInstance);
export const run = taskRunnerInstance.run.bind(taskRunnerInstance);
export const serial = taskRunnerInstance.serial.bind(taskRunnerInstance);
export const parallel = taskRunnerInstance.parallel.bind(taskRunnerInstance);
