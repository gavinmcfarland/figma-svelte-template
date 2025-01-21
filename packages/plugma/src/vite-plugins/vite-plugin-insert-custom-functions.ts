import type { Plugin } from "vite";
import type {
	NormalizedOutputOptions,
	OutputBundle,
	OutputChunk,
} from "rollup";

interface CustomFunctionsOptions {
	/**
	 * Code to be prepended to the entry chunk
	 */
	codeToPrepend?: string;
	[key: string]: unknown;
}

/**
 * A Vite plugin that inserts custom functions at the beginning of the entry chunk.
 * Created because using esbuild.banner was including functions in every include,
 * and writing it to file manually was causing it to be minified which means
 * vite.define can't find the functions because the function names change.
 *
 * @param options - Configuration options containing the code to prepend
 * @returns A Vite plugin configuration object
 */
export default function vitePluginInsertCustomFunctions(
	options: CustomFunctionsOptions = {},
): Plugin {
	return {
		name: "vite-plugin-insert-custom-functions",
		apply: "build",
		enforce: "post", // Ensures this plugin runs after other plugins and transformations

		generateBundle(
			outputOptions: NormalizedOutputOptions,
			bundle: OutputBundle,
		): void {
			const { codeToPrepend = "" } = options;

			// Find the main entry chunk
			let entryChunk: OutputChunk | undefined;
			for (const fileName in bundle) {
				const chunk = bundle[fileName];
				if (chunk.type === "chunk" && chunk.isEntry) {
					entryChunk = chunk;
					break; // Modify only the first main entry chunk
				}
			}

			if (entryChunk && codeToPrepend) {
				// Prepend the code to the entry chunk
				entryChunk.code = codeToPrepend + entryChunk.code;
			}
		},
	};
}
