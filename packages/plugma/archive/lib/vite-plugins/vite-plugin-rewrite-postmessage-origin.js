// This is needed is developers use https://www.figma.com as the target origin because the nested iframe that's used to pass messages will not receive it because parent (figma.com) has an origin of null

export default function rewritePostMessageTargetOrigin() {
	return {
		name: 'rewrite-postmessage-origin',

		transform(code, id) {
			// Process only JavaScript files (or files already transformed into JavaScript)
			// if (!id.endsWith('.js')) return null;

			// Replace "https://www.figma.com" with "*"
			const updatedCode = code.replace(
				/postMessage\((.*?),\s*["']https:\/\/www\.figma\.com["']\)/g,
				'postMessage($1, "*")'
			);

			return {
				code: updatedCode,
				map: null,
			};
		},
	};
}
