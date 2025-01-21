export default function deepIndex(options = {}) {
	return {
		name: "deep-index",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url === "/") {
					req.url = "/node_modules/plugma/tmp/index.html";
				}
				next();
			});
		},
	}
}

