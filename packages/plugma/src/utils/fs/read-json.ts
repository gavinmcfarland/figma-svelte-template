import { promises as fsPromises } from 'node:fs';

/**
 * Reads and parses a JSON file asynchronously.
 * This function provides type-safe JSON parsing with comprehensive error handling.
 *
 * @template T - The expected type of the parsed JSON data
 * @param filePath - Absolute or relative path to the JSON file
 * @returns Promise that resolves to the parsed JSON object of type T
 * @throws {Error} 'File not found' if the file doesn't exist
 * @throws {Error} 'Invalid JSON format' if the file contains invalid JSON
 * @throws {Error} Original error for other file system errors
 * @throws {Error} 'Unknown error reading JSON file' for unexpected errors
 *
 * @example
 * ```ts
 * interface Config {
 *   apiKey: string;
 *   endpoint: string;
 * }
 *
 * try {
 *   const config = await readJson<Config>('./config.json');
 *   console.log(config.apiKey);
 * } catch (err) {
 *   console.error('Failed to read config:', err);
 * }
 * ```
 */
export async function readJson<T>(filePath: string): Promise<T> {
  try {
    const data = await fsPromises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err instanceof Error) {
      if ('code' in err && (err as any).code === 'ENOENT') {
        throw new Error('File not found');
      }
      if (err instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw err;
    }
    throw new Error('Unknown error reading JSON file');
  }
}
