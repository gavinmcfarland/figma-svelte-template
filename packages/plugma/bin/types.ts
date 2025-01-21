export interface DebugOptions {
  debug?: boolean;
  [key: string]: unknown;
}
export interface ScriptOptions extends DebugOptions {
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
