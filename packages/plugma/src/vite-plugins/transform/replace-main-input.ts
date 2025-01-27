import type { IndexHtmlTransformContext, Plugin } from 'vite';

interface ReplaceMainInputOptions {
  /**
   * The name of the plugin to replace in the HTML template
   */
  pluginName?: string;
  /**
   * The path to the input file that will replace the default src
   */
  input?: string;
  [key: string]: unknown;
}

/**
 * A Vite plugin that replaces the main input script source in the HTML template
 * and optionally replaces the plugin name placeholder.
 *
 * @param options - Configuration options containing pluginName and input path
 * @returns A Vite plugin configuration object
 */
export function replaceMainInput(
  options: ReplaceMainInputOptions = {},
): Plugin {
  return {
    name: 'replace-js-input',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, ctx: IndexHtmlTransformContext): string {
        let transformedHtml = html;

        // Replace plugin name if provided
        if (options.pluginName) {
          transformedHtml = transformedHtml.replace(
            '{pluginName}',
            options.pluginName,
          );
        }

        // Replace script source with the provided input path
        if (options.input) {
          transformedHtml = transformedHtml.replace(
            '<script type="module" id="entry" src="/src/ui.ts"></script>',
            `<script type="module" id="entry" src="/${options.input}"></script>`,
          );
        }

        return transformedHtml;
      },
    },
  };
}

export default replaceMainInput;

// Alternative implementation (commented out)
// export default function replaceMainInput(options: ReplaceMainInputOptions = {}): Plugin {
//   return {
//     name: 'replace-main-input',
//     transformIndexHtml(html: string): string {
//       console.log('Replacing src with:', options.input);
//       return html.replace('src="/src/ui.ts"', `src="/${options.input}"`);
//     },
//   };
// }
