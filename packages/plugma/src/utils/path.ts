import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Replaces backslashes with forward slashes in a path string
 */
export function replaceBackslashInString(stringPath: string): string {
  return path.sep === '\\'
    ? path.resolve(stringPath).split(path.sep).join('/')
    : stringPath;
}

/**
 * Retrieves the directory name from a given import.meta.url
 *
 * @param url - The URL from which to extract the directory name
 * @returns The directory name as a string
 */
export function getDirName(url: string): string {
  return path.dirname(fileURLToPath(new URL(url)));
}
