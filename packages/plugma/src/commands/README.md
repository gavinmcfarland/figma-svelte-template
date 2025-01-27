# Commands System

This directory contains the core command implementations for the Plugma CLI. The system is built around a task-based architecture where each command executes a sequence of reusable tasks.

## Architecture Overview

### Directory Structure

```
commands/
├── README.md          # This file
├── types.ts          # Command type definitions
├── config.ts         # Configuration utilities
├── index.ts         # Command exports
├── tasks/           # Task implementations
│   ├── build/       # Build-related tasks
│   │   ├── manifest.ts
│   │   ├── ui.ts
│   │   └── main.ts
│   ├── server/      # Server-related tasks
│   │   ├── vite.ts
│   │   └── websocket.ts
│   └── common/      # Shared tasks
│       ├── files.ts
│       └── prompt.ts
├── dev.ts           # Development command
├── preview.ts       # Preview command
├── build.ts         # Build command
└── release.ts       # Release command
```

### Core Concepts

1. **Tasks**: Self-contained units of work with their own type definitions and results
2. **Commands**: High-level operations that execute task sequences
3. **Task Results**: Strongly typed values returned by tasks
4. **Task Context**: Runtime context containing options and previous task results
5. **Command Options**: Configuration options specific to each command

## Commands

### `dev` Command
- **Purpose**: Starts a development server with live reload
- **Options**: 
  - `debug`: Enable debug logging
  - `mode`: Development mode (defaults to 'development')
  - `port`: Server port (defaults to 3000)
  - `output`: Output directory (defaults to 'dist')
- **Tasks Executed**:
  1. `get-files`: Load plugin files and configuration
  2. `show-plugma-prompt`: Display startup information
  3. `build-manifest`: Generate plugin manifest
  4. `build-placeholder-ui`: Create development UI
  5. `build-main`: Build plugin main script
  6. `start-websockets-server`: Start WebSocket server for live reload
  7. `start-vite-server`: Start Vite dev server

### `preview` Command
- **Purpose**: Preview production build with development server
- **Options**: Same as `dev` command
- **Tasks Executed**: Same sequence as `dev` command but in preview mode

### `build` Command
- **Purpose**: Create production build of the plugin
- **Options**:
  - `debug`: Enable debug logging
  - `mode`: Build mode (defaults to 'production')
  - `output`: Output directory (defaults to 'dist')
- **Tasks Executed**:
  1. `get-files`: Load plugin files and configuration
  2. `show-plugma-prompt`: Display build information
  3. `build-manifest`: Generate plugin manifest
  4. `build-ui`: Build production UI
  5. `build-main`: Build production main script

## Tasks

### Common Tasks

#### `get-files`
- **Purpose**: Loads user configuration and files
- **Supported Commands**: All
- **Returns**: 
  ```typescript
  {
    plugmaPkg: PackageJson;   // Plugin package info
    files: UserFiles;         // User source files
    config: PluginConfig;     // Plugin configuration
  }
  ```
- **Location**: `tasks/common/files.ts`

#### `show-plugma-prompt`
- **Purpose**: Displays command startup information
- **Supported Commands**: All
- **Returns**: void
- **Location**: `tasks/common/prompt.ts`
- **Requires**: Results from `get-files`

### Build Tasks

#### `build-manifest`
- **Purpose**: Generates plugin manifest
- **Supported Commands**: All
- **Returns**:
  ```typescript
  {
    raw: ManifestFile;      // Original manifest
    processed: ManifestFile; // Processed manifest
  }
  ```
- **Location**: `tasks/build/manifest.ts`
- **Requires**: Results from `get-files`

#### `build-placeholder-ui`
- **Purpose**: Creates development UI if none exists
- **Supported Commands**: dev, preview
- **Returns**: void
- **Location**: `tasks/build/ui.ts`
- **Requires**: Results from `get-files`

#### `build-ui`
- **Purpose**: Builds production UI with Vite
- **Supported Commands**: build
- **Returns**: void
- **Location**: `tasks/build/ui.ts`
- **Requires**: Results from `get-files`

#### `build-main`
- **Purpose**: Builds plugin main script
- **Supported Commands**: All
- **Returns**: void
- **Location**: `tasks/build/main.ts`
- **Requires**: Results from `get-files`, `build-manifest`

### Server Tasks

#### `start-websockets-server`
- **Purpose**: Starts WebSocket server for live reload
- **Supported Commands**: dev, preview
- **Returns**: 
  ```typescript
  {
    port: number;           // Server port
    server: WebSocketServer; // Server instance
  }
  ```
- **Location**: `tasks/server/websocket.ts`
- **Requires**: Results from `get-files`

#### `start-vite-server`
- **Purpose**: Starts Vite development server
- **Supported Commands**: dev, preview
- **Returns**: void
- **Location**: `tasks/server/vite.ts`
- **Requires**: Results from `get-files`, `build-manifest`

## Task Development

### Creating a New Task

1. Create a new file in the appropriate tasks directory
2. Define the task's result type (if any)
3. Implement the task using `TaskDefinition`
4. Export both type and implementation

Example:
```typescript
// tasks/build/ui.ts
export interface BuildUiResult {
  outputPath: string;
}

export const buildUi: TaskDefinition<BuildUiResult> = {
  name: 'build-ui',
  supportedCommands: ['build'],
  execute: async ({ options, results }) => {
    const files = getTaskResult(results, getFiles);
    if (!files) throw new Error('get-files task must run first');
    // Implementation...
  }
};
```
