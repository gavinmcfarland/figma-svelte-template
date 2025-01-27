import type { TaskOptions } from '#core/types.js';

/**
 * Creates mock task options with default values for testing.
 */
export function createMockTaskOptions(
  overrides: Partial<TaskOptions> = {},
): TaskOptions {
  return {
    command: 'dev',
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
    ...overrides,
  };
}
