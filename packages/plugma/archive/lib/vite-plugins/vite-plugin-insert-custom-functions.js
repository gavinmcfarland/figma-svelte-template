// Created because using esbuild.banner was including functions in every include. And writing it to file manually was
// causing it to be minified which means vite.define can't find the functions because the function names change

export default function vitePluginInsertCustomFunctions(options = {}) {
	return {
		name: 'vite-plugin-insert-custom-functions',
		apply: 'build',
		enforce: 'post', // Ensures this plugin runs after other plugins and transformations

		generateBundle(_, bundle) {
			const { codeToPrepend = '' } = options;

			// Find the main entry chunk
			let entryChunk;
			for (const fileName in bundle) {
				const chunk = bundle[fileName];
				if (chunk.type === 'chunk' && chunk.isEntry) {
					entryChunk = chunk;
					break; // Modify only the first main entry chunk
				}
			}

			if (entryChunk && codeToPrepend) {
				// Prepend the code to the entry chunk
				entryChunk.code = codeToPrepend + entryChunk.code;
			}
		}
	};
}
