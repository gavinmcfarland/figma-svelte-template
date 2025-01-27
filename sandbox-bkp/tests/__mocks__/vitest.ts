/**
 * Mock Vitest test function for testing
 */
export const test = (name: string, fn: () => Promise<void> | void) => {
  return {
    name,
    fn,
    concurrent: false,
    sequential: true,
    only: false,
    skip: false,
    todo: false,
    fails: false,
    browserOnly: false,
  };
};
