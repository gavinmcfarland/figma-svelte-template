# Previous Architecture Tasks

This document lists all tasks that were part of the previous Plugma architecture, as found in [`run-script.js`](../archive/scripts/run-script.js).

## Core Tasks (from [`run-script.js`](../archive/scripts/run-script.js))

1. `get-files` ([L63-L68](../archive/scripts/run-script.js#L63-L68))
   - Reads Plugma's package.json (not user's)
   - Gets user files via `getUserFiles`
   - Creates Vite configurations via `createConfigs`
   - Returns: plugmaPkg, files, and config objects

2. `show-plugma-prompt` ([L70-L76](../archive/scripts/run-script.js#L70-L76))
   - Displays Plugma version from package
   - Shows "Watching for changes" message in watch modes (dev/preview/build+watch)

3. `build-manifest` ([L78-L195](../archive/scripts/run-script.js#L78-L195))
   - Builds and maintains manifest.json with defaults
   - Watches manifest.json and package.json for changes
   - Watches src directory for file additions/removals
   - Triggers server restart and rebuilds on changes
   - Manages UI and main file tracking
   - Cleans manifest files at key points

4. `build-placeholder-ui` ([L197-L223](../archive/scripts/run-script.js#L197-L223))
   - Only processes if UI file exists
   - Creates development version of UI using PluginWindow.html
   - Injects runtime data into the HTML
   - Creates ui.html in output directory

5. `build-ui` ([L225-L296](../archive/scripts/run-script.js#L225-L296))
   - Handles production UI builds via Vite
   - Manages Vite UI instance (closes previous)
   - Supports watch mode with minification
   - Shows build duration and status
   - Cleans manifest files after build

6. `build-main` ([L298-L385](../archive/scripts/run-script.js#L298-L385))
   - Handles main plugin file builds via Vite
   - Manages Vite build instance
   - Handles environment file watching
   - Supports different build modes with appropriate configs
   - Queues websocket messages if build in progress

7. `start-vite-server` ([L387-L398](../archive/scripts/run-script.js#L387-L398))
   - Only runs if UI is present in manifest
   - Initializes and manages Vite dev server

8. `start-websockets-server` ([L400-L404](../archive/scripts/run-script.js#L400-L404))
   - Only runs if websockets option is enabled
   - Starts WebSocket server via external script
   - Shows preview URL with port

## Release Tasks (from [`run-release.js`](../archive/scripts/run-release.js))

1. `runRelease` ([L24-L225](../archive/scripts/run-release.js#L24-L225))
   - Checks for uncommitted changes in working directory
   - Ensures GitHub workflow templates are present and up-to-date
   - Validates Git repository status
   - Updates plugin version in package.json:
     - Supports manual version via `--version`
     - Auto-increments for stable releases
     - Handles alpha/beta releases with subversions
   - Commits changes and creates Git tag
   - Includes release title and notes in tag message
   - Pushes changes and tag to remote
   - Runs `plugma build` after successful release
   - Reverts commit on push failure

2. `copyDirectory` ([L10-L23](../archive/scripts/run-release.js#L10-L23))
   - Recursively copies template directory to destination
   - Creates destination if it doesn't exist
   - Preserves file permissions

3. `copyIfOutOfDate` ([L236-L252](../archive/scripts/run-release.js#L236-L252))
   - Compares source and destination file timestamps
   - Only copies if source is newer or destination missing
   - Used to update GitHub workflow templates

4. `setGitHubEnv` ([L226-L235](../archive/scripts/run-release.js#L226-L235))
   - Sets GitHub Actions environment variables
   - Appends key-value pairs to GITHUB_ENV file
   - Used by GitHub workflow templates

## Task Execution Flows

### Dev/Preview Mode

```
serial([
    'get-files',
    'show-plugma-prompt',
    'build-manifest',
    'build-placeholder-ui',
    'build-main',
    'start-websockets-server',
    'start-vite-server',
])
```

### Build Mode

```
serial([
    'get-files',
    'show-plugma-prompt',
    'build-manifest',
    'build-ui',
    'build-main'
])
```

## Key Features

- File watching and rebuilding
- Environment file handling
- Development and production builds
- WebSocket support for preview mode
- Manifest management
- Separate UI and main builds
- Build status reporting
- Automated release management
- GitHub workflow integration
- Version control integration

## Apps Integration

The CLI uses several apps that are built and copied as part of the package:

1. `ViteApp` ([`App.svelte`](../../apps/src/apps/ViteApp/App.svelte))
   - Browser-side development bridge
   - Only active when plugin is viewed directly in browser (not in Figma)
   - Integration:
     - Injected by [`html-transform` plugin](../src/vite-plugins/transform/html-transform.ts#L22-L43)
     - Plugin only included in development configuration ([`create-vite-configs.ts#L67`](../src/utils/config/create-vite-configs.ts#L67))
   - Key responsibilities:
     - Simulates Figma environment in browser:
       - Intercepts postMessage calls ([`App.svelte#L98-L116`](../../apps/src/apps/ViteApp/App.svelte#L98-L116))
       - Provides message event handling ([`App.svelte#L61-L96`](../../apps/src/apps/ViteApp/App.svelte#L61-L96))
       - Shows development server status ([`App.svelte#L232-L242`](../../apps/src/apps/ViteApp/App.svelte#L232-L242))
     - Manages WebSocket communication:
       - Relays messages between server and plugin
       - Syncs Figma styles across environments ([`App.svelte#L41-L93`](../../apps/src/apps/ViteApp/App.svelte#L41-L93))
     - Development status indicators:
       - WebSocket connection status
       - Server status
       - Plugin connection status

2. `DevToolbar.html` (8.9KB) ([`App.svelte`](../../apps/src/apps/DevToolbar/App.svelte))
   - [DEPRECATED] Standalone developer toolbar
   - Functionality now integrated into PluginWindow's Toolbar component
   - Original `-t, --toolbar` flag still exists but controls the integrated toolbar

3. `PluginWindow` ([`App.svelte`](../../apps/src/apps/PluginWindow/App.svelte))
   - Development-only container for the plugin UI
   - Integration:
     - Used by [`build-placeholder-ui` task](../archive/scripts/run-script.js#L72-L95)
     - Injected with runtime data during development
     - Creates an iframe-based sandbox for the plugin UI ([`App.svelte#L134`](../../apps/src/apps/PluginWindow/App.svelte#L134))
   - Key responsibilities:
     - Provides an iframe container for the plugin's UI
     - Relays messages between Figma and the plugin ([`App.svelte#L25-L39`](../../apps/src/apps/PluginWindow/App.svelte#L25-L39))
     - Syncs Figma styles and classes:
       - Observes HTML classes ([`App.svelte#L77-L95`](../../apps/src/apps/PluginWindow/App.svelte#L77-L95))
       - Monitors stylesheet changes
       - Broadcasts style changes to connected clients
     - WebSocket communication bridge:
       - Relays messages between parent (Figma) and iframe (plugin UI)
       - Handles messages from WebSocket server
       - Routes messages to appropriate targets
   - Development features:
     - Developer toolbar integration ([`App.svelte#L134`](../../apps/src/apps/PluginWindow/App.svelte#L134))
     - Server status monitoring ([`App.svelte#L136-L142`](../../apps/src/apps/PluginWindow/App.svelte#L136-L142))
     - Localhost connection validation
     - Plugin window resizing

### Development Architecture

When running in Figma:

```
Figma Plugin
    │
    ▼
PluginWindow (container)
    │    ├─ Toolbar (when dev tools active)
    │    ├─ Server Status
    │    └─ Style Sync
    │
    ▼
iframe (plugin's UI)
```

When viewing in browser:

```
Browser
    │
    ▼
Plugin's UI
    │
    ▼
ViteApp (development bridge)
    ├─ Message Simulation
    ├─ Server Status
    └─ Style Sync
```

### Development Flow

1. Development setup:
   - `build-placeholder-ui` creates UI with PluginWindow wrapper for Figma
   - Vite dev server serves plugin UI with ViteApp injected for browser

2. In Figma:
   - PluginWindow loads and creates iframe
   - Plugin UI loads in iframe
   - Messages flow: Figma ↔ PluginWindow ↔ Plugin UI ↔ WebSocket

3. In Browser:
   - Plugin UI loads with injected ViteApp
   - ViteApp provides Figma environment simulation
   - Messages flow: ViteApp ↔ Plugin UI ↔ WebSocket

### Message Flow in Development

1. Figma → PluginWindow:
   - Messages from Figma are received
   - Forwarded to iframe and WebSocket clients
2. Plugin UI → PluginWindow:
   - Messages from iframe are captured
   - Routed to Figma (parent) or other clients
3. WebSocket → PluginWindow:
   - Messages from WS server are received
   - Distributed to appropriate targets (parent/iframe)

### Apps Build Process

- Apps are built from a separate project in `../apps`
- Built apps are copied into the package during:
  - Development: via `build-and-copy-apps` script
  - Publishing: via `prepublishOnly` npm hook
- Build commands:
  ```
  build-and-copy-apps: npm run build-apps && npm run copy-apps
  build-apps: cd ../apps && npm run build
  copy-apps: node scripts/copy-files.js
  ```

## Current Task Runner Architecture

The task system has been modernized with a type-safe, dependency-aware TaskRunner implementation. Key improvements include:

### Core Components

1. `TaskRunner` Class
   - Type-safe task registration and execution
   - Supports serial and parallel task execution
   - Built-in logging and timing
   - Command type validation
   - Context sharing between tasks
   - Automatic error handling and propagation
   - Task execution timing and performance tracking
   - Debug mode support for detailed logging

2. Task Definition
   ```typescript
   type RegisteredTask<Name, Options, Results, Context> = {
     name: Name;
     run: (options: Options, context: Context) => Promise<Results>;
     supportedCommands?: string[];
   };
   ```

3. Helper Functions
   - `task()` - Registers a new task with type inference
   - `run()` - Executes a single task with full type safety
   - `serial()` - Runs tasks in sequence with dependency validation
   - `parallel()` - Runs multiple tasks concurrently
   - `log()` - Structured logging with formatting options

### Key Features

1. Type Safety
   - Full TypeScript support with generic type inference
   - Compile-time validation of task dependencies
   - Type-safe context sharing between tasks
   - Command type validation

2. Task Management
   - Automatic dependency validation
   - Command support validation
   - Context sharing between tasks
   - Built-in performance timing
   - Structured logging
   - Error handling and propagation

3. Development Support
   - Debug mode for detailed logging
   - Performance tracking and timing
   - Task execution status reporting
   - Error stack traces and context

4. Testing Support
   - Mock task creation utilities
   - Task execution tracking
   - Failure simulation
   - Context mocking

### Task Execution Flows

Tasks can now be composed in multiple ways:

1. Single Task:
   ```typescript
   await run(task, options, context);
   ```

2. Serial Execution:
   ```typescript
   await serial(task1, task2, task3)(options);
   ```

3. Parallel Execution:
   ```typescript
   await parallel([task1, task2, task3], options);
   ```

4. Mixed Execution:
   ```typescript
   await serial(task1, parallel([task2, task3]), task4)(options);
   ```

### Testing Utilities

The task system includes robust testing utilities:

1. Mock Task Creation
   ```typescript
   const mockTask = createMockTask('task-name', expectedResult);
   const failingTask = createMockFailingTask('task-name', new Error('fail'));
   const trackedTask = createMockTrackedTask('task-name', result);
   ```

2. Context Mocking
   ```typescript
   const mockContext = createMockContext(options, previousResults);
   ```

3. Result Mocking
   ```typescript
   const mockResult = createMockTaskResult('task-name', data);
   ```

### Implementation Details

1. Task Registration
   ```typescript
   // Register a task with type inference
   const buildTask = task('build', async (options: BuildOptions) => {
     // Task implementation
     return buildResult;
   });

   // Register a task with command support
   const devTask = task('dev', async (options: DevOptions) => {
     // Task implementation
     return devResult;
   });
   devTask.supportedCommands = ['dev', 'preview'];
   ```

2. Error Handling
   ```typescript
   try {
     const result = await run(task, options, context);
   } catch (error) {
     // Error is automatically logged with stack trace
     // Task timing is recorded even for failed tasks
   }
   ```

3. Context Sharing
   ```typescript
   // First task produces data
   const task1 = task('task1', async (opt, ctx) => ({
     data: 'shared data',
   }));

   // Second task consumes data from first task
   const task2 = task('task2', async (opt, ctx) => {
     const data = ctx.task1.data;
     return processData(data);
   });

   // Run tasks in sequence with context sharing
   await serial(task1, task2)(options);
   ```

4. Performance Tracking
   ```typescript
   // Tasks are automatically timed
   console.time(`Task "${task.name}"`);
   try {
     const result = await task.run(options, context);
     console.timeEnd(`Task "${task.name}"`);
   } catch (error) {
     console.timeEnd(`Task "${task.name}"`);
     throw error;
   }
   ```

5. Debug Logging
   ```typescript
   const log = new Logger({ debug: true });
   log.format({ indent: 1 }).debug(`Starting task "${task.name}"`);
   log.format({ indent: 2 }).debug(`Options: ${JSON.stringify(options)}`);
   log.format({ indent: 2 }).debug(`Context: ${JSON.stringify(context)}`);
   ```

### Testing Examples

1. Basic Task Testing
   ```typescript
   describe('Task Execution', () => {
     test('should execute tasks in sequence', async () => {
       const task1 = taskRunner.task('task1', async (opt: {}, ctx: {}) => 'result1');
       const task2 = taskRunner.task('task2', async (_: {}, context: { task1: string }) => {
         expect(context.task1).toBe('result1');
         return 42;
       });

       const results = await taskRunner.serial(task1, {}, task2);
       expect(results.task1).toBe('result1');
       expect(results.task2).toBe(42);
     });
   });
   ```

2. Error Testing
   ```typescript
   test('should handle task execution errors', async () => {
     const task = taskRunner.task('error-task', async () => {
       throw new Error('Task execution failed');
     });

     await expect(taskRunner.serial('error-task', {})).rejects.toThrow('Task execution failed');
   });
   ```

3. Command Support Testing
   ```typescript
   test('should support multiple commands', async () => {
     const task = taskRunner.task('multi-task', async () => 'result');
     task.supportedCommands = ['dev', 'build'];

     const devResults = await taskRunner.serial('multi-task', { command: 'dev' });
     expect(devResults.multi_task).toBe('result');

     const buildResults = await taskRunner.serial('multi-task', { command: 'build' });
     expect(buildResults.multi_task).toBe('result');
   });
   ```

### Development Architecture

[Previous development architecture section remains unchanged...]

### Development Flow

[Previous development flow section remains unchanged...]

### Message Flow in Development

[Previous message flow section remains unchanged...]

### Apps Build Process

[Previous apps build process section remains unchanged...]

### Task Composition

1. Task Dependencies
   ```typescript
   // Task that depends on multiple previous tasks
   const buildTask = task('build', async (opt, ctx) => {
     const { manifest } = ctx['build:manifest'];
     const { ui } = ctx['build:ui'];
     const { main } = ctx['build:main'];
     return { manifest, ui, main };
   });

   // Run tasks with dependencies
   await serial('build:manifest', 'build:ui', 'build:main', buildTask)(options);
   ```

2. Conditional Tasks
   ```typescript
   // Task that only runs in certain conditions
   const uiTask = task('build:ui', async (opt, ctx) => {
     const { manifest } = ctx['build:manifest'];
     if (!manifest.ui) return null;
     return buildUI(manifest.ui);
   });

   // Task that checks previous task results
   const validateTask = task('validate', async (opt, ctx) => {
     if (!ctx['build:ui']) {
       log.warn('No UI build found, skipping validation');
       return;
     }
     return validateUI(ctx['build:ui']);
   });
   ```

3. Task Groups
   ```typescript
   // Group related tasks
   const buildTasks = ['build:manifest', 'build:ui', 'build:main'];

   // Run task group in parallel
   await parallel(buildTasks, options);

   // Run task group in series
   await serial(...buildTasks)(options);
   ```

### Advanced Features

1. Task Lifecycle Hooks
   ```typescript
   const task = taskRunner.task('build', async (opt, ctx) => {
     // Pre-run hook
     log.debug('Starting build...');

     try {
       // Task execution
       const result = await build(opt);

       // Post-run hook
       log.success('Build completed');
       return result;
     } catch (error) {
       // Error hook
       log.error('Build failed:', error);
       throw error;
     } finally {
       // Cleanup hook
       log.debug('Cleaning up...');
     }
   });
   ```

2. Task Result Transformation
   ```typescript
   // Transform task results before passing to next task
   const transformTask = task('transform', async (opt, ctx) => {
     const { files } = ctx['get:files'];
     return {
       ...files,
       transformed: true,
       timestamp: Date.now(),
     };
   });
   ```

3. Task Command Validation
   ```typescript
   const devTask = task('dev', async (opt, ctx) => {
     // Task implementation
   });

   // Specify supported commands
   devTask.supportedCommands = ['dev', 'preview'];

   // Will throw error if command is not supported
   await run(devTask, { command: 'build' }, {});
   ```

4. Task Context Validation
   ```typescript
   const task = taskRunner.task('validate', async (opt, ctx) => {
     // Validate required context
     if (!ctx['build:manifest']) {
       throw new Error('Missing required context: build:manifest');
     }

     // Validate context shape
     const { manifest } = ctx['build:manifest'];
     if (!manifest.name || !manifest.version) {
       throw new Error('Invalid manifest in context');
     }

     return validateManifest(manifest);
   });
   ```

### Development Architecture

When running in Figma:

```
Figma Plugin
    │
    ▼
PluginWindow (container)
    │    ├─ Toolbar (when dev tools active)
    │    ├─ Server Status
    │    └─ Style Sync
    │
    ▼
iframe (plugin's UI)
```

When viewing in browser:

```
Browser
    │
    ▼
Plugin's UI
    │
    ▼
ViteApp (development bridge)
    ├─ Message Simulation
    ├─ Server Status
    └─ Style Sync
```

### Development Flow

1. Development setup:
   - `build-placeholder-ui` creates UI with PluginWindow wrapper for Figma
   - Vite dev server serves plugin UI with ViteApp injected for browser

2. In Figma:
   - PluginWindow loads and creates iframe
   - Plugin UI loads in iframe
   - Messages flow: Figma ↔ PluginWindow ↔ Plugin UI ↔ WebSocket

3. In Browser:
   - Plugin UI loads with injected ViteApp
   - ViteApp provides Figma environment simulation
   - Messages flow: ViteApp ↔ Plugin UI ↔ WebSocket

### Message Flow in Development

1. Figma → PluginWindow:
   - Messages from Figma are received
   - Forwarded to iframe and WebSocket clients
2. Plugin UI → PluginWindow:
   - Messages from iframe are captured
   - Routed to Figma (parent) or other clients
3. WebSocket → PluginWindow:
   - Messages from WS server are received
   - Distributed to appropriate targets (parent/iframe)

### Apps Build Process

- Apps are built from a separate project in `../apps`
- Built apps are copied into the package during:
  - Development: via `build-and-copy-apps` script
  - Publishing: via `prepublishOnly` npm hook
- Build commands:
  ```
  build-and-copy-apps: npm run build-apps && npm run copy-apps
  build-apps: cd ../apps && npm run build
  copy-apps: node scripts/copy-files.js
  ```
