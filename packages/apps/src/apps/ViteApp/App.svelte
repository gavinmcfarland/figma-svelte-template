<script>
	import { nanoid } from 'nanoid'
	import { onMount } from 'svelte'

	import { monitorUrl } from '../../shared/monitorUrl'
	import ServerStatus from '../PluginWindow/lib/ServerStatus.svelte'
	import app from './main'
	import { localClientConnected, remoteClients } from '../../shared/stores'

	import { Log } from '../../../../plugma/lib/logger'
	import { setupWebSocket } from '../../shared/setupWebSocket'

	const html = document.querySelector('html')

	const isInsideIframe = window.self !== window.top
	const isInsideFigma = typeof figma !== 'undefined'

	let message = null
	let isWebsocketServerActive = false
	let isWebsocketsEnabled = window.runtimeData.websockets || false

	// let ws = new WebSocket('ws://localhost:9001/ws')
	let ws = setupWebSocket(null, window.runtimeData.websockets)
	let url = `http://localhost:${window.runtimeData.port}`

	const log = new Log({
		debug: window.runtimeData.debug,
	})

	const processedMessages = new Set()

	function listenForFigmaStyles() {
		const handleMessage = (event) => {
			const message = event.data.pluginMessage

			if (message.type === 'FIGMA_HTML_CLASSES') {
				html.className = message.data

				// Save styles because they are lost when VITE server resets
				localStorage.setItem('figmaHtmlClasses', message.data)
			}
			if (message.type === 'FIGMA_STYLES') {
				const styleSheet = document.createElement('style')
				styleSheet.type = 'text/css'
				styleSheet.innerText = message.data

				// Append the style tag to the head
				document.head.appendChild(styleSheet)

				// Save styles because they are lost when VITE server resets
				localStorage.setItem('figmaStyles', message.data)

				// Optionally remove the listener once the style is applied
				// window.removeEventListener('message', handleMessage)
			}
		}

		ws.on(handleMessage, 'window')
	}

	function getFigmaStyles() {
		let message = {
			pluginMessage: {
				type: 'GET_FIGMA_CLASSES_AND_STYLES',
			},
			pluginId: '*',
		}
		parent.postMessage(message, '*')
	}

	function applyStoredStyles() {
		const storedClasses = localStorage.getItem('figmaHtmlClasses')

		if (storedClasses) {
			html.className = storedClasses
		}

		const storedStyles = localStorage.getItem('figmaStyles')
		if (storedStyles) {
			const styleSheet = document.createElement('style')
			styleSheet.type = 'text/css'
			styleSheet.innerText = storedStyles
			document.head.appendChild(styleSheet)
		}
	}

	function overrideMessageEvent() {
		if (!(isInsideIframe || isInsideFigma)) {
			let originalAddEventListener = window.addEventListener
			let originalOnMessageHandler = null
			let messageListeners = []

			// Override addEventListener for 'message' events
			window.addEventListener = function (type, listener, options) {
				if (type === 'message') {
					messageListeners.push(listener) // Store the listener
				} else {
					originalAddEventListener.call(window, type, listener, options)
				}
			}

			// Function to trigger all stored message listeners
			function triggerMessageListeners(event) {
				messageListeners.forEach((listener) => {
					try {
						listener(event) // Call each listener
					} catch (err) {
						console.error('Error in message listener:', err)
					}
				})
			}

			// Intercept WebSocket messages and pass them to the stored message listeners
			ws.on((event) => {
				// Trigger all registered message listeners
				triggerMessageListeners(event)
			}, 'ws')

			// Override window.onmessage using Object.defineProperty
			Object.defineProperty(window, 'onmessage', {
				get: function () {
					return originalOnMessageHandler
				},
				set: function (handler) {
					originalOnMessageHandler = handler
					// Ensure WebSocket's onmessage works with the new handler
					ws.on((event) => {
						// const message = JSON.parse(wsEvent.data)
						// const event = { data: JSON.parse(message) }

						// Trigger the new handler
						if (originalOnMessageHandler) {
							originalOnMessageHandler(event)
						}

						// Also trigger all stored listeners
						triggerMessageListeners(event)
					}, 'ws')
				},
			})
		}
	}

	function interceptPostMessage() {
		// Override postMessage if not inside iframe or Figma
		if (!(isInsideIframe || isInsideFigma)) {
			// Store the original postMessage function
			const originalPostMessage = window.postMessage

			window.postMessage = function (message, targetOrigin, transfer) {
				// Intercept and log the message
				let messageId = nanoid()
				// Check if this message has already been processed
				// if (!processedMessages.has(messageId)) {
				// processedMessages.add(messageId)
				ws.post(message, 'ws')
				// }

				return null
				// // Call the original postMessage to maintain functionality
				// originalPostMessage.call(window, message, targetOrigin, transfer)
			}
		}
	}

	function reimplementFigmaListeners() {
		document.addEventListener(
			'keydown',
			(e) => {
				if (e.keyCode === 80 /* P */ && !e.shiftKey && e.altKey && !e.ctrlKey && e.metaKey) {
					// Handle the plugin re-run shortcut
					window.parent.postMessage('$INTERNAL_DO_NOT_USE$RERUN_PLUGIN$', '*')
					e.stopPropagation()
					e.stopImmediatePropagation()
				} else if (true) {
					// Handle Select All, Undo and Redo in the desktop app
					const ctrlDown = e.metaKey
					if (ctrlDown) {
						if (e.keyCode === 65 /* A */) {
							document.execCommand('selectAll')
						} else if (e.keyCode === 90 /* Z */) {
							if (e.shiftKey) {
								document.execCommand('redo')
							} else {
								document.execCommand('undo')
							}
						} else if ((e.key === 'x' || e.key === 'X') && false) {
							document.execCommand('cut')
						} else if ((e.key === 'c' || e.key === 'C') && false) {
							document.execCommand('copy')
						} else if ((e.key === 'v' || e.key === 'V') && false) {
							document.execCommand('paste')
						}
					}
				}
			},
			true,
		)
	}

	// listenForWebSocketMessage()
	reimplementFigmaListeners()
	interceptPostMessage()
	overrideMessageEvent()
	listenForFigmaStyles()
	applyStoredStyles()

	ws.open(() => {
		isWebsocketServerActive = true
		getFigmaStyles()
	})

	ws.close(() => {
		isWebsocketServerActive = false
	})

	let isServerActive = true

	$: monitorUrl(url, null, (isActive) => {
		isServerActive = isActive
	})

	$: console.log('remoteClients', $remoteClients)

	onMount(async () => {
		parent.postMessage(
			{
				pluginMessage: { type: 'VITE_APP_MOUNTED' },
				pluginId: '*',
			},
			'*',
		)
	})
</script>

<!-- so it only appears in browser, because don't want overlap with one in PluginWindow-->

{#if !(isInsideIframe || isInsideFigma)}
	{#if isServerActive}
		{#if !isWebsocketsEnabled}
			<ServerStatus message="Websockets disababled"></ServerStatus>
		{:else if !isWebsocketServerActive}
			<ServerStatus message="Connecting to websocket server..."></ServerStatus>
		{:else if !($remoteClients.length > 0)}
			<ServerStatus message="Open plugin inside Figma"></ServerStatus>
		{/if}
	{:else}
		<ServerStatus></ServerStatus>
	{/if}
{/if}
