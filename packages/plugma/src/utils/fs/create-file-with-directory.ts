import { mkdir, writeFile } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Creates a file with its directory structure if it doesn't exist.
 * This function will:
 * 1. Create all necessary parent directories recursively
 * 2. Write the provided content to the file
 * 3. Execute a callback with the result
 *
 * @param filePath - Base directory path where the file should be created
 * @param fileName - Name of the file to create
 * @param fileContent - Content to write to the file
 * @param callback - Optional callback function that receives an error or success result
 *
 * @example
 * ```ts
 * createFileWithDirectory(
 *   './output',
 *   'config.json',
 *   '{"key": "value"}',
 *   (err) => {
 *     if (err) console.error('Failed to create file:', err);
 *     else console.log('File created successfully');
 *   }
 * );
 * ```
 */
export function createFileWithDirectory(
  filePath: string,
  fileName: string,
  fileContent: string,
  callback?: (err: Error | null, result?: string) => void,
): void {
  const defaultCallback = (err: Error | null, result?: string) => {
    if (err) {
      console.error('Error:', err);
    } else if (result) {
      console.log(result);
    }
  };

  const cb = callback || defaultCallback;
  const directoryPath = dirname(resolve(filePath, fileName));

  mkdir(directoryPath, { recursive: true }, (err) => {
    if (err) {
      cb(err);
    } else {
      writeFile(resolve(filePath, fileName), fileContent, 'utf8', (err) => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      });
    }
  });
}
