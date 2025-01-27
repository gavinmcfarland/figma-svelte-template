import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const CURR_DIR = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export default function htmlTransform(options = {}) {
	return {
		// Insert catchFigmaStyles and startWebSocketServer
		name: 'html-transform',
		transformIndexHtml(html) {

			// Can't use template with ejs template directly, so we have to add our file to it first
			let viteAppProxyDev = fs.readFileSync(path.join(__dirname, '../../apps/ViteApp.html'), 'utf8')

			const runtimeData = `<script>
	  // Global variables defined on the window object
	  window.runtimeData = ${JSON.stringify(options)};
	</script>`;

			viteAppProxyDev = viteAppProxyDev.replace(/^/, runtimeData)

			// Apply Vite App scripts n stuff
			html = html.replace('<body>', `<body>${viteAppProxyDev}`)

			// // Add app div and script to bottom
			// html = html.replace('id="entry" src="/main.js"', `src="${data.manifest.ui}"`);


			// if (options._[0] === "dev" && options.toolbar) {

			// 	html = html.replace('<body>', `<body>${files.devToolbarFile}`)
			// }

			return html;
		},
		apply: 'serve'
	}
}
