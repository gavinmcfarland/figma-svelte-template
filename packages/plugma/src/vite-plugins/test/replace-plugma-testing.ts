/**
 * Vite plugin for replacing "plugma/testing" with the "plugma/testing/figma"
 * when building the plugin.
 */

import path from 'node:path';

import type { Plugin } from 'vite';

import { getDirName } from '#utils/get-dir-name.js';

/**
 * Creates a Vite plugin that injects our test framework
 */
export function replacePlugmaTesting(): Plugin {
  return {
    name: 'plugma:test',
    enforce: 'pre',

    resolveId(id: string) {
      // Intercept plugma/testing imports
      if (id === 'plugma/testing') {
        return path.resolve(getDirName(), '../../testing/figma/index.js');
      }
    },
  };
}
