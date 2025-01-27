/**
 * Common test utilities for build tasks
 */

import type { BuildUiTask } from '#tasks/build/ui';
import { vi } from 'vitest';

/**
 * Mock options object used across build task tests
 */
export const mockBuildOptions = {
  command: 'dev' as const,
  mode: 'development',
  port: 3000,
  output: 'dist',
  instanceId: 'test',
  debug: false,
} satisfies Partial<BuildUiTask['options']>;

/**
 * Mock build options with entry and outDir for main build task
 */
export const mockMainBuildOptions = {
  ...mockBuildOptions,
  entry: 'src/main.ts',
  outDir: 'dist',
} satisfies BuildUiTask['options'];

/**
 * Sets up common fs mocks used in build tests
 */
export function setupFsMocks() {
  vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
  }));
}

/**
 * Sets up Vite build mock
 */
export function setupViteMock() {
  vi.mock('vite', () => ({
    build: vi.fn(),
  }));
}

/**
 * Resets all mocks and modules before each test
 */
export function resetMocks() {
  vi.resetModules();
  vi.clearAllMocks();
}
