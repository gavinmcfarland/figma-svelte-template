import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

interface HtmlTransformOptions {
	[key: string]: unknown;
}

/**
 * A Vite plugin that transforms the HTML template by injecting runtime data and custom components
 *
 * @param options - Configuration options to be injected as runtime data
 * @returns A Vite plugin configuration object
 */
export default function htmlTransform(
	options: HtmlTransformOptions = {},
): Plugin {
	return {
		name: "html-transform",
		transformIndexHtml(html: string): string {
			try {
				// Can't use template with ejs template directly, so we have to add our file to it first
				const viteAppProxyDev = readFileSync(
					join(__dirname, "../../apps/ViteApp.html"),
					"utf8",
				);

				const runtimeData = `<script>
          // Global variables defined on the window object
          window.runtimeData = ${JSON.stringify(options)};
        </script>`;

				// Add runtime data at the beginning and inject the Vite App content into the body
				const transformedHtml = html.replace(
					"<body>",
					`<body>${runtimeData}${viteAppProxyDev}`,
				);

				// // Add app div and script to bottom
				// html = html.replace('id="entry" src="/main.js"', `src="${data.manifest.ui}"`);

				// // if (options._[0] === "dev" && options.toolbar) {
				// //   html = html.replace('<body>', `<body>${files.devToolbarFile}`)
				// // }

				return transformedHtml;
			} catch (error) {
				console.error("Error transforming HTML:", error);
				return html; // Return original HTML if transformation fails
			}
		},
		apply: "serve",
	};
}
