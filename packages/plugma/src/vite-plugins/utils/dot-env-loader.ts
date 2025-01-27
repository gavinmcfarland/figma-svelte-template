import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ConfigEnv, Plugin, UserConfig } from 'vite';

const rootDir = process.cwd();

interface EnvRecord {
  [key: string]: string;
}

/**
 * Parses the content of an environment file into key-value pairs
 *
 * @param content - The raw content of the .env file
 * @returns An object containing the parsed environment variables
 */
function parseEnvFile(content: string): EnvRecord {
  const env: EnvRecord = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Ignore comments and empty lines
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // Split key-value pairs
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    if (key) {
      // Remove quotes from value if present
      env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  return env;
}

/**
 * Loads and merges environment variables from multiple .env files
 *
 * @returns An object containing all environment variables
 */
function loadEnvFiles(): EnvRecord {
  const envFiles = [
    resolve(rootDir, '.env'),
    resolve(rootDir, '.env.local'), // Default .env
    resolve(rootDir, `.env.${process.env.NODE_ENV}`), // Environment-specific .env (e.g., .env.development, .env.production)
    resolve(rootDir, `.env.${process.env.NODE_ENV}.local`), // Local overrides, if any
  ];

  // Create a new object with only string values from process.env
  const env: EnvRecord = Object.fromEntries(
    Object.entries(process.env).filter(([_, v]) => typeof v === 'string'),
  ) as EnvRecord;

  // Remove problematic Windows environment variables
  const envWithoutProblematicVars = { ...env };
  delete envWithoutProblematicVars['CommonProgramFiles(x86)'];
  delete envWithoutProblematicVars['ProgramFiles(x86)'];

  for (const file of envFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf-8');
      const parsedEnv = parseEnvFile(content);
      Object.assign(envWithoutProblematicVars, parsedEnv);
      console.log(
        `[custom-env-loader] Reloaded environment variables from: ${file}`,
      );
    }
  }

  return envWithoutProblematicVars;
}

/**
 * A Vite plugin that loads environment variables from .env files
 *
 * @param options - Optional configuration options (currently unused)
 * @returns A Vite plugin configuration object
 */
export function dotEnvLoader(options = {}): Plugin {
  return {
    name: 'custom-env-loader',
    config(config: UserConfig, { command }: ConfigEnv): UserConfig {
      // Reload environment variables freshly for each build or serve command
      const env = loadEnvFiles();

      // Return the environment variables to be applied in the build configuration
      return {
        define: {
          ...Object.fromEntries(
            Object.entries(env).map(([key, value]) => [
              `process.env.${key}`,
              JSON.stringify(value),
            ]),
          ),
        },
      };
    },
  };
}

export default dotEnvLoader;
