/**
 * Types for the CLI interface
 */

export interface ScriptOptions {
  port?: number;
  toolbar?: boolean;
  mode?: string;
  output?: string;
  websockets?: boolean;
  watch?: boolean;
}

export interface ReleaseOptions {
  title?: string;
  notes?: string;
  type?: 'alpha' | 'beta' | 'stable';
  version?: string;
}

export type ReleaseType = 'alpha' | 'beta' | 'stable';
