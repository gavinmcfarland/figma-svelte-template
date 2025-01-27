//@index('./**/types.ts', f => `export * from '${f.path}.js';`)
export * from './listeners/types.js';
export * from './task-runner/types.js';
//@endindex

import type { UserConfig } from 'vite';

/**
 * Plugin options for configuring the build process
 */
export interface PluginOptions {
  mode: string;
  port: number;
  output: string;
  command?: 'preview' | 'dev' | 'build';
  instanceId: string;
  debug?: boolean;
  watch?: boolean;
  manifest?: ManifestFile;
  [key: string]: unknown;
}

/**
 * Manifest file structure for Figma plugins
 */
export interface ManifestFile {
  name: string;
  version: string;
  main: string;
  ui?: string;
  api: string;
  networkAccess?: {
    devAllowedDomains?: string[];
    allowedDomains?: string[];
  };
  [key: string]: unknown;
}

/**
 * User files configuration
 */
export interface UserFiles {
  manifest: ManifestFile;
  userPkgJson: {
    name: string;
    version: string;
    plugma?: {
      manifest?: ManifestFile;
    };
  };
}

export interface ViteConfigs {
  vite: {
    dev: UserConfig;
    build: UserConfig;
  };
  viteMain: {
    dev: UserConfig;
    build: UserConfig;
  };
}
