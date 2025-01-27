import type { ManifestFile, PluginOptions } from '#core/types';
import type { EmptyObject, Join, Simplify, UnionToTuple } from 'type-fest';

type TaskDef = { name: string; handler: (options: any, context?: any) => any };

/**
 * Utility type to extract the task type from a task creator function
 */
export type GetTaskTypeFor<T extends TaskDef> = {
  name: T extends { name: infer N } ? N : never;
  options: Parameters<T['handler']>[0];
  context: Parameters<T['handler']>[1];
  results: Awaited<ReturnType<T['handler']>>;
  handler: T['handler'];
};

/**
 * Maps each task to its results type, preserving the exact mapping between task names and their specific result types
 */
type ResultsOfTask<T extends TaskDef> = {
  [K in T['name']]: Extract<T, { name: K }>['handler'] extends (
    ...args: any[]
  ) => Promise<infer R>
    ? R
    : never;
};

/**
 * Converts a union of string literals to a comma-separated string literal type
 */
export type UnionToString<T extends string> =
  UnionToTuple<T> extends readonly string[]
    ? Join<UnionToTuple<T>, ', '>
    : never;

type TaskDependencyError<
  Name extends string,
  Missing extends string,
> = `Task '${Name}' must come after tasks: ${UnionToString<Missing>}`;

/**
 * Validates that tasks are ordered correctly based on their context dependencies
 */
type ValidateTaskOrder<
  Names extends readonly T['name'][],
  T extends TaskDef,
  Acc extends string = never,
> = Names extends []
  ? never
  : Names extends readonly [infer First extends string]
    ? Extract<T, { name: First }>['handler'] extends (
        options: any,
        context: infer Context,
      ) => any
      ? Context extends ResultsOfTask<infer TaskDeps>
        ? TaskDeps['name'] extends Acc
          ? Names
          : TaskDependencyError<First, Exclude<TaskDeps['name'], Acc>>
        : Names
      : never
    : Names extends readonly [
          infer First extends string,
          ...infer Rest extends string[],
        ]
      ? Extract<T, { name: First }>['handler'] extends (
          options: any,
          context: infer Context,
        ) => any
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

type TaskGroupOptions<T extends TaskDef, Names extends readonly T['name'][]> = {
  [K in Names[number] as Extract<T, { name: K }>['handler'] extends (
    options: infer O,
    ...args: any[]
  ) => any
    ? O extends EmptyObject
      ? never
      : K
    : never]: Extract<T, { name: K }>['handler'] extends (
    options: infer O,
    ...args: any[]
  ) => any
    ? O
    : never;
};

////////////////////////////////////////// HELPER FUNCTIONS //////////////////////////////////////////
/**
 * Creates a strongly-typed task with a name and handler function
 */
function task<TName extends string, TOptions, TResults, TContext>(
  name: TName,
  handler: (options: TOptions, context: TContext) => Promise<TResults>,
) {
  return {
    name,
    handler,
  } as const;
}

function serial<
  T extends Tasks,
  First extends T['name'],
  Rest extends T['name'][],
>(
  firstTask: [First, ...Rest] extends ValidateTaskOrder<[First, ...Rest], T>
    ? First
    : ValidateTaskOrder<[First, ...Rest], T>,
  ...otherTasks: Rest
): (options: Simplify<TaskGroupOptions<T, [First, ...Rest]>>) => void {
  const tasks = [firstTask, ...otherTasks] as const;
  throw new Error('test');
}

////////////////////////////////////// EXAMPLE TASKS //////////////////////////////////////

export type GetManifestTask = GetTaskTypeFor<typeof getManifest>;
export const getManifest = task(
  'get-manifest',
  async (options: PluginOptions): Promise<ManifestFile> =>
    Promise.resolve({
      name: 'test',
      version: '2.0.0',
      main: 'test',
      api: 'test',
    }),
);

export type GetPackageJsonTask = GetTaskTypeFor<typeof getPackageJson>;
export const getPackageJson = task(
  'get-package-json',
  async (options: EmptyObject) =>
    Promise.resolve({
      name: 'test',
      version: '1.0.0' as const,
    }),
);

export type PrintVersionsTask = GetTaskTypeFor<typeof PrintVersionsTask>;
export const PrintVersionsTask = task(
  'print-versions',
  async (
    _options: { as: 'json' | 'text' },
    context: ResultsOfTask<GetManifestTask | GetPackageJsonTask>,
  ) => {
    if (_options.as === 'json') {
      return {
        packageJson: context['get-package-json'].version,
        manifest: context['get-manifest'].version,
      };
    }

    return `Package version: ${context['get-package-json'].version}\nManifest version: ${context['get-manifest'].version}`;
  },
);

export default PrintVersionsTask;

type Tasks = GetManifestTask | GetPackageJsonTask | PrintVersionsTask;

////////////////////////////////////// OTHER TESTS //////////////////////////////////////

// resolves to: ["get-manifest"]
type Test1 = ValidateTaskOrder<['get-manifest'], Tasks, never>;

// resolves to: ["get-manifest", "get-package-json"]
type Test2 = ValidateTaskOrder<
  ['get-manifest', 'get-package-json'],
  Tasks,
  never
>;

type Test3 = ValidateTaskOrder<['get-package-json', 'get-manifest'], Tasks>;

// resolves to: "Task 'print-versions' must come after tasks: get-manifest, get-package-json"
type Test4 = ValidateTaskOrder<
  ['print-versions', 'get-manifest', 'get-package-json'],
  Tasks
>;

// resolves to: "Task 'print-versions' must come after tasks: get-manifest"
type Test5 = ValidateTaskOrder<
  ['get-package-json', 'print-versions', 'get-manifest'],
  Tasks
>;

// resolves to: ['get-package-json', 'get-manifest', 'print-versions']
type Test6 = ValidateTaskOrder<
  ['get-package-json', 'get-manifest', 'print-versions'],
  Tasks
>;

// resolves to: ['get-manifest', 'get-package-json', 'print-versions']
type Test7 = ValidateTaskOrder<
  ['get-manifest', 'get-package-json', 'print-versions'],
  Tasks
>;

// This is valid
serial(
  'get-manifest',
  'get-package-json',
  'print-versions',
)({
  'get-manifest': {
    instanceId: 'test',
    mode: 'test',
    port: 1234,
    output: 'test',
  },
  'print-versions': {
    as: 'json',
  },
});

// This would be a type error with the message:
// Argument of type '"print-versions"' is not assignable to parameter of type '"Task 'print-versions' must come after tasks: get-manifest, get-package-json"'.
serial('get-manifest', 'get-package-json', 'print-versions');
