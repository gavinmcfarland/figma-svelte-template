import type { Plugin, ViteDevServer } from "vite";

/**
 * A Vite plugin that redirects root requests ('/') to a specific index.html file
 * in the node_modules directory.
 *
 * @param options - Optional configuration options for the plugin (currently unused)
 * @returns A Vite plugin configuration object
 */
export default function deepIndex(options = {}): Plugin {
	return {
		name: "deep-index",
		configureServer(server: ViteDevServer) {
			server.middlewares.use((req, res, next) => {
				if (req.url === "/") {
					req.url = "/node_modules/plugma/tmp/index.html";
				}
				next();
			});
		},
	};
}
