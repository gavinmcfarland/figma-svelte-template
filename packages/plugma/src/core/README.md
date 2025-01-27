# Core

Core system components and types. This layer handles the foundational operations like task execution, WebSocket communication, and Adobe app interactions.

## Components

### Task Runner (`task-runner/`)
Executes tasks in a controlled environment with proper lifecycle management.

```typescript
import { Task, taskCaller } from './task-runner'

// Define and run tasks
taskCaller((task, run) => {
  task('example', function* (opts) {
    yield log('Running example task')
    return opts.value * 2
  })

  run('example', { value: 10 })
})
```

### WebSocket Server (`ws-server.cts`)
Handles bidirectional communication with Adobe apps.

```typescript
import { createServer } from './ws-server'

const server = await createServer({
  port: 8080,
  onMessage: (msg) => {
    // Handle incoming messages
  }
})
```

### Global Shims (`global-shim.ts`)
Adobe app environment shims and type augmentations. Import this in your plugin's entry point:

```typescript
import './global-shim'
```

### Event System (`listeners/`)
Event handling for plugin lifecycle and communication.

```typescript
import { on } from './listeners'

on('plugin:start', () => {
  // Handle plugin start
})
```

## Type System

Core types are defined in `types.ts`. Key interfaces:

```typescript
interface PluginConfig {
  name: string
  version: string
  // ... see types.ts for full definition
}

interface TaskContext<T = unknown> {
  options: PluginOptions
  results: Record<string, T>
}
```

## Common Patterns

### Task Definition
```typescript
task('name', function* (opts) {
  // 1. Validate inputs
  if (!opts.required) throw new Error('Missing required option')

  // 2. Yield progress/status
  yield log('Processing...')

  // 3. Return results
  return { success: true }
})
```

### WebSocket Communication
```typescript
// 1. Create server
const server = await createServer(config)

// 2. Send message
await server.send({ type: 'update', data: {} })

// 3. Handle response
server.on('message', (msg) => {
  switch (msg.type) {
    case 'response':
      // Handle response
      break
  }
})
```
