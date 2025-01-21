# Converting project to TypeScript

This is a tracker for the task of converting the files in `lib/` to TypeScript in the folder `src/`.

Any `.cjs` files should be converted to `.cts` files.

## Project Structure

lib/
├── global-shim.js
├── logger.js
├── mainListeners.js
├── start-web-sockets-server.cjs
├── suppress-logs.js
└── vite-plugins
    ├── vite-plugin-copy-dir.js
    ├── vite-plugin-deep-index.js
    ├── vite-plugin-delete-dist-on-error.js
    ├── vite-plugin-dot-env-loader.js
    ├── vite-plugin-html-transform.js
    ├── vite-plugin-insert-custom-functions.js
    ├── vite-plugin-log-file-updates.js
    ├── vite-plugin-replace-main-input.js
    ├── vite-plugin-rewrite-postmessage-origin.js
    └── vite-plugin-surpress-logs.js

## Conversion Tracking

- [x] global-shim.js
- [x] logger.js
- [x] mainListeners.js
- [x] start-web-sockets-server.cjs
- [x] suppress-logs.js
- [x] vite-plugins
    - [x] vite-plugin-copy-dir.js
    - [x] vite-plugin-deep-index.js
    - [x] vite-plugin-delete-dist-on-error.js
    - [x] vite-plugin-dot-env-loader.js
    - [x] vite-plugin-html-transform.js
    - [x] vite-plugin-insert-custom-functions.js
    - [x] vite-plugin-log-file-updates.js
    - [x] vite-plugin-replace-main-input.js
    - [x] vite-plugin-rewrite-postmessage-origin.js
    - [x] vite-plugin-surpress-logs.js

## Verified

- [ ] global-shim.js
- [ ] logger.js
- [ ] mainListeners.js
- [x] start-web-sockets-server.cjs
- [ ] suppress-logs.js
- [x] vite-plugins
    - [ ] vite-plugin-copy-dir.js
    - [x] vite-plugin-deep-index.js
    - [x] vite-plugin-delete-dist-on-error.js
    - [x] vite-plugin-dot-env-loader.js
    - [x] vite-plugin-html-transform.js
    - [x] vite-plugin-insert-custom-functions.js
    - [x] vite-plugin-log-file-updates.js
    - [x] vite-plugin-replace-main-input.js
    - [x] vite-plugin-rewrite-postmessage-origin.js
    - [x] vite-plugin-surpress-logs.js

### Implementation Differences Found

#### start-web-sockets-server.cts
- Changed WebSocket handling to properly handle the ExtendedWebSocket type by casting after connection
- Changed forEach loop to for...of loop for better type safety and continue support
- Fixed WebSocket method calls to use the base WebSocket instance for standard methods

#### vite-plugin-dot-env-loader.ts
- Changed process.env handling to filter out non-string values before assignment
- Changed environment variable deletion to use a new object to avoid direct deletion
- Changed forEach loops to for...of loops for better iteration

#### vite-plugin-insert-custom-functions.ts
- Changed OutputBundle and OutputChunk imports to use Rollup types instead of Vite types
- Added proper type for the generateBundle options parameter

#### vite-plugin-suppress-logs.ts
- Changed process.stdout.write handling to use a properly typed intermediate function
- Improved error callback type safety by removing null from possible error types
- Removed redundant else block and simplified the control flow
