/**
 * Common types for command implementations
 */

import type { ViteDevServer } from 'vite';

export type CommandName = 'dev' | 'preview' | 'build' | 'release';

/**
 * Base options shared by all commands
 */
export interface BaseCommandOptions {
  command: CommandName;
  debug?: boolean;
  mode?: string;
  output?: string;
}

/**
 * Options specific to development commands (dev and preview)
 */
export interface DevCommandOptions extends BaseCommandOptions {
  command: 'dev' | 'preview';
  port?: number;
  toolbar?: boolean;
  websockets?: boolean;
}

/**
 * Options specific to the build command
 */
export interface BuildCommandOptions extends BaseCommandOptions {
  command: 'build';
  watch?: boolean;
}

/**
 * Options specific to the release command
 */
export interface ReleaseCommandOptions extends BaseCommandOptions {
  command: 'release';
  version?: string;
  type?: 'stable' | 'alpha' | 'beta';
  title?: string;
  notes?: string;
}

/**
 * Shared state for Vite server instances
 */
export interface ViteServerState {
  viteServer: ViteDevServer | null;
  viteBuild: ViteDevServer | null;
  viteUi: ViteDevServer | null;
}
