import { writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cwd } from 'node:process';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { replaceBackslashInString } from '../path.js';

const CURR_DIR = cwd();

/**
 * Creates a temporary file containing the main plugin code initialization.
 * This function generates a temporary file that imports and executes the plugin's main entry point.
 * It's typically used during the plugin's runtime to create a temporary execution context.
 *
 * @param fileName - Name of the temporary file to create
 * @param userFiles - Object containing user's plugin files information, including the manifest
 * @param options - Plugin configuration options
 * @returns The absolute path to the created temporary file
 *
 * @example
 * ```ts
 * const tempPath = writeTempFile(
 *   'plugin-main.js',
 *   { manifest: { main: './src/index.js' } },
 *   {}
 * );
 * // Use the temporary file...
 * ```
 */
export function writeTempFile(
  fileName: string,
  userFiles: UserFiles,
  options: PluginOptions,
): string {
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const modifiedContentPath = replaceBackslashInString(
    path.join(CURR_DIR, userFiles.manifest.main),
  );
  const modifiedContent = `import plugmaMain from '${modifiedContentPath}';
    plugmaMain();`;
  writeFileSync(tempFilePath, modifiedContent);
  return tempFilePath;
}
