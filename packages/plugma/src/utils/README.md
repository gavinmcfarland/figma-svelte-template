# Utils

Shared utilities for file operations, logging, configuration, and more. Import what you need:

```typescript
import { fs, path, time } from '../utils'
```

## File Operations (`fs.ts`)
```typescript
import { fs } from '../utils'

// Async file operations with proper error handling
await fs.ensureDir('./dist')
await fs.copy('./src', './dist')
await fs.remove('./temp')
```

## Path Management (`path.ts`)
```typescript
import { path } from '../utils'

const configPath = path.resolve('plugma.config.ts')
const isConfig = path.match(configPath, '*.config.ts')
```

## Logging (`log/`)
```typescript
import { log } from '../utils'

log.info('Processing started')
log.success('Task completed')
log.error('Failed to load config', error)
log.debug('Raw data:', data)
```

## Time Utilities (`time.ts`)
```typescript
import { time } from '../utils'

await time.sleep(1000)
const duration = time.measure(() => heavyOperation())
```

## Resource Cleanup (`cleanup.ts`)
```typescript
import { cleanup } from '../utils'

cleanup.add('server', () => server.close())
cleanup.add('tempFiles', () => fs.remove('./temp'))
```

## CLI Helpers (`cli/`)
```typescript
import { cli } from '../utils'

const args = cli.parseArgs(process.argv)
cli.printHelp()
await cli.prompt('Continue?')
```

## Config Management (`config/`)
```typescript
import { config } from '../utils'

const cfg = await config.load('./plugma.config.ts')
config.validate(cfg)
```

## Testing

Each utility has its own test suite. Run specific tests:
```bash
npm test -- src/utils/fs.test.ts
npm test -- src/utils/log
```

## Error Handling

All utilities use consistent error handling:
```typescript
try {
  await fs.copy(src, dest)
} catch (error) {
  if (error.code === 'ENOENT') {
    // Handle missing file
  }
  throw error
}
```
