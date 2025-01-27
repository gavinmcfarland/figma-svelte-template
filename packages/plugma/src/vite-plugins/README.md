# Vite Plugins

Custom Vite plugins for Adobe plugin development. Each plugin is focused on a specific build/development concern.

## Development Plugins (`dev/`)

### Live Reload
```typescript
import { liveReload } from './dev/live-reload'

export default {
  plugins: [
    liveReload({
      // Watch specific files/patterns
      include: ['src/**/*.{ts,tsx}'],
      // Ignore patterns
      exclude: ['**/*.test.ts']
    })
  ]
}
```

### Debug Tools
```typescript
import { debugTools } from './dev/debug-tools'

export default {
  plugins: [
    debugTools({
      // Enable source maps
      sourcemap: true,
      // Log level
      logLevel: 'verbose'
    })
  ]
}
```

## Build Plugins (`build/`)

### Asset Optimization
```typescript
import { optimizeAssets } from './build/optimize-assets'

export default {
  plugins: [
    optimizeAssets({
      // Compression options
      compress: true,
      // Minification
      minify: true
    })
  ]
}
```

### Adobe-Specific
```typescript
import { adobeCompat } from './build/adobe-compat'

export default {
  plugins: [
    adobeCompat({
      // Target Adobe app
      target: 'photoshop',
      // API version
      apiVersion: '2024'
    })
  ]
}
```

## Transform Plugins (`transform/`)

### Import/Export
```typescript
import { transformImports } from './transform/imports'

export default {
  plugins: [
    transformImports({
      // Transform patterns
      patterns: {
        '@adobe/*': '@adobe/photoshop-*'
      }
    })
  ]
}
```

### Platform Specific
```typescript
import { platformTransform } from './transform/platform'

export default {
  plugins: [
    platformTransform({
      // Platform specific transforms
      platform: process.platform,
      // Features to enable
      features: ['filesystem', 'network']
    })
  ]
}
```

## Plugin Development

### Creating New Plugins
```typescript
import type { Plugin } from 'vite'

export function myPlugin(options = {}): Plugin {
  return {
    name: 'my-plugin',
    
    // Hook into build
    buildStart() {
      // Setup
    },
    
    // Transform code
    transform(code, id) {
      // Transform logic
      return code
    },
    
    // Cleanup
    buildEnd() {
      // Cleanup
    }
  }
}
```

### Testing Plugins
```typescript
import { build } from 'vite'
import { myPlugin } from './my-plugin'

describe('myPlugin', () => {
  test('transforms code correctly', async () => {
    const result = await build({
      plugins: [myPlugin()],
      // Test config
    })
    // Assertions
  })
})
``` 
