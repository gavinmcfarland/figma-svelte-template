// FIXME: Is there another function I need to call for this? One that happens before build?
export default function replaceMainInput(options = {}) {
	return {
		name: 'replace-js-input',
		transformIndexHtml: {
			order: 'pre',
			handler(html, { mode }) {
				// Modify the script tag's src in the HTML template
				if (options.pluginName) {
					html = html.replace('{pluginName}', options.pluginName)
				}

				return html.replace(
					'<script type="module" id="entry" src="/src/ui.ts"></script>',
					`<script type="module" id="entry" src="/${options.input}"></script>`
				);
			},
		},
	}
}


// export default function replaceMainInput(options = {}) {
// 	return {
// 		name: 'replace-main-input',
// 		transformIndexHtml(html) {
// 			console.log('Replacing src with:', options.input);
// 			return html.replace('src="/src/ui.ts"', `src="/${options.input}"`);
// 		},
// 	}
// }
