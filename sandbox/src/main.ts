// Read the docs https://plugma.dev/docs

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true })

	figma.ui.onmessage = (message) => {
		if (message.type === 'CREATE_RECTANGLES') {
			let i = 0

			let rectangles = []
			while (i < message.count) {
				const rect = figma.createRectangle()
				rect.x = i * 150
				rect.y = 0
				rect.resize(100, 100)
				rect.fills = [{ type: 'SOLID', color: { r: Math.random(), g: Math.random(), b: Math.random() } }] // Random color
				rectangles.push(rect)

				i++
			}

			figma.viewport.scrollAndZoomIntoView(rectangles)
		}
	}

	function postNodeCount() {
		const nodeCount = figma.currentPage.selection.length

		figma.ui.postMessage({
			type: 'POST_NODE_COUNT',
			count: nodeCount,
		})
	}

	figma.on('selectionchange', postNodeCount)
}
