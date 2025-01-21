import type { Plugin, TransformResult } from "vite";

/**
 * A Vite plugin that rewrites postMessage target origins from "https://www.figma.com" to "*".
 * This is needed if developers use https://www.figma.com as the target origin because the
 * nested iframe that's used to pass messages will not receive it because parent (figma.com)
 * has an origin of null.
 *
 * @returns A Vite plugin configuration object
 */
export default function rewritePostMessageTargetOrigin(): Plugin {
	return {
		name: "rewrite-postmessage-origin",

		transform(code: string, id: string): TransformResult {
			// Process only JavaScript files (or files already transformed into JavaScript)
			// if (!id.endsWith('.js')) return null;

			// Replace "https://www.figma.com" with "*"
			const updatedCode = code.replace(
				/postMessage\((.*?),\s*["']https:\/\/www\.figma\.com["']\)/g,
				'postMessage($1, "*")',
			);

			return {
				code: updatedCode,
				map: null,
			};
		},
	};
}
