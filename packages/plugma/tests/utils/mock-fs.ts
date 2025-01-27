/**
 * Test utilities for mocking the file system
 */

import type { Dirent } from 'node:fs';

/**
 * Creates a mock directory entry
 * @param name - Name of the entry
 * @param isDirectory - Whether the entry is a directory
 * @returns A mock directory entry
 */
export function createMockDirent(name: string, isDirectory = false): Dirent {
  return {
    name,
    isFile: () => !isDirectory,
    isDirectory: () => isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  } as Dirent;
}

/**
 * A simple in-memory filesystem mock for testing
 */
export class MockFs {
  private files: Map<string, string> = new Map();

  /**
   * Add files to the mock filesystem
   */
  addFiles(files: Record<string, string>): void {
    for (const [path, content] of Object.entries(files)) {
      this.files.set(path, content);
    }
  }

  /**
   * Mock implementation of fs.readFile
   */
  readFile = async (path: string): Promise<string> => {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  };

  /**
   * Mock implementation of fs.writeFile
   */
  writeFile = async (path: string, content: string): Promise<void> => {
    this.files.set(path, content);
  };

  /**
   * Mock implementation of fs.exists
   */
  exists = async (path: string): Promise<boolean> => {
    return this.files.has(path);
  };

  /**
   * Clear all files from the mock filesystem
   */
  clear(): void {
    this.files.clear();
  }
}

export const createMockFs = (): MockFs => new MockFs();

/**
 * Creates a mock file system with common plugin files
 * @returns Mock fs functions and initial structure
 */
export function createMockPluginFs() {
  const structure: Record<string, string> = {
    'package.json': JSON.stringify({
      name: 'test-plugin',
      version: '1.0.0',
      main: 'src/main.ts',
      ui: 'src/ui.tsx',
    }),
    'src/main.ts': 'export default function() {}',
    'src/ui.tsx': 'export default function UI() { return null; }',
    'manifest.json': JSON.stringify({
      name: 'Test Plugin',
      id: 'test-plugin',
      api: '1.0.0',
      main: 'dist/main.js',
      ui: 'dist/ui.html',
    }),
  };

  return createMockFs();
}

/**
 * Creates a mock file system with build artifacts
 * @returns Mock fs functions and initial structure
 */
export function createMockBuildFs() {
  const structure: Record<string, string> = {
    'dist/main.js': 'console.log("main")',
    'dist/ui.html': '<html><body>UI</body></html>',
    'dist/manifest.json': JSON.stringify({
      name: 'Test Plugin',
      id: 'test-plugin',
      api: '1.0.0',
      main: 'dist/main.js',
      ui: 'dist/ui.html',
    }),
  };

  return createMockFs();
}
