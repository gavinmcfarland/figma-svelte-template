import ReconnectingWebSocket from 'reconnecting-websocket'
import { Log } from '../../../plugma/lib/logger'
import { localClientConnected, remoteClients, localClientId, pluginWindowClients } from './stores' // Import the Svelte stores
import { get } from 'svelte/store'

const log = new Log({
	debug: window.runtimeData.debug,
})

const isInsideIframe = window.self !== window.top
const isInsideFigma = typeof figma !== 'undefined'

interface ExtendedWebSocket extends ReconnectingWebSocket {
	post: (messages: any, via: any) => void
	on: (callback: any, via: any) => void
	open: (callback: () => void) => void
	close: (callback?: () => void) => void
}

export function setupWebSocket(
	iframeTarget = null,
	enableWebSocket = true,
	registerSource = false,
): ExtendedWebSocket | typeof mockWebSocket {
	const messageQueue: any[] = []
	let openCallbacks: (() => void)[] = []
	let closeCallbacks: (() => void)[] = []
	let pingInterval: number

	const mockWebSocket = {
		send: (data) => {
			console.warn('WebSocket is disabled, cannot send data:', data)
		},
		post: (messages, via) => {
			if (Array.isArray(messages)) {
				messages.forEach((message) => sendMessageToTargets(message, via))
			} else {
				sendMessageToTargets(messages, via)
			}
		},
		on: (callback, via) => {
			if (Array.isArray(via)) {
				via.forEach((method) => addMessageListener(method, callback))
			} else {
				addMessageListener(via, callback)
			}
		},
		open: (callback) => {},
		close: (callback) => {
			// console.warn('WebSocket is disabled, no connection to close.')
			if (callback) {
				callback()
			}
		},
		addEventListener: (type, listener) => {},
		removeEventListener: (type, listener) => {},
		onmessage: null,
		onopen: null,
		onclose: null,
		onerror: null,
	}

	function sendMessageToTargets(message, via) {
		if (Array.isArray(via)) {
			via.forEach((option) => postMessageVia(option, message))
		} else {
			postMessageVia(via, message)
		}
	}

	function postMessageVia(via, message) {
		log.info(`--- ws post, ${via}`, message)
		if (via === 'iframe' && iframeTarget && iframeTarget.contentWindow.postMessage) {
			console.log('post message to iframe', message)
			iframeTarget.contentWindow.postMessage(message, '*')
		} else if (via === 'parent' && window.parent) {
			window.parent.postMessage(message, '*')
		} else if (via === 'window') {
			console.log('Posting message to window:', message)
			window.postMessage(message, '*')
		} else if (via === 'ws') {
			if (enableWebSocket) {
				console.log('post message to ws', Boolean(ws), ws.readyState, WebSocket.OPEN, message)
				if (!ws || ws.readyState !== WebSocket.OPEN) {
					// console.warn('WebSocket is disabled or not open, queuing message:', message)
					messageQueue.push({ message, via })
				} else {
					ws.send(JSON.stringify(message))
				}
			}
		} else {
			console.warn(`Cannot send message via ${via}.`)
		}
	}

	function addMessageListener(via, callback) {
		if (via === 'window') {
			window.addEventListener('message', callback)
		} else if (via === 'parent' && window.parent) {
			window.addEventListener('message', (event) => {
				if (event.source === window.parent) {
					callback(event)
				}
			})
		} else if (via === 'ws' && enableWebSocket) {
			ws.addEventListener('message', (event) => {
				try {
					const parsedData = JSON.parse(event.data)
					const newEvent = { ...event, data: parsedData }
					callback(newEvent)
				} catch (error) {
					console.error('Failed to parse WebSocket message data:', error)
					callback(event)
				}
			})
		} else {
			// console.warn(`Cannot add message listener via ${via}.`)
		}
	}

	if (!enableWebSocket || !('WebSocket' in window)) {
		return mockWebSocket
	}

	let source = ''

	if (registerSource) {
		if (isInsideIframe || isInsideFigma) {
			source = `?source=plugin-window`
		} else {
			source = `?source=browser`
		}
	}

	let ws = new ReconnectingWebSocket(`ws://localhost:9001/ws${source}`) as ExtendedWebSocket

	ws.post = (messages, via = ['ws']) => {
		if (Array.isArray(messages)) {
			messages.forEach((message) => sendMessageToTargets(message, via))
		} else {
			sendMessageToTargets(messages, via)
		}
	}

	ws.on = (callback, via = ['ws']) => {
		if (Array.isArray(via)) {
			via.forEach((method) => addMessageListener(method, callback))
		} else {
			addMessageListener(via, callback)
		}
	}

	ws.open = (callback: () => void) => {
		openCallbacks.push(callback)
		if (ws.readyState === WebSocket.OPEN) {
			callback()
		}
	}

	ws.close = (callback?: () => void) => {
		closeCallbacks.push(callback)
		if (ws.readyState === WebSocket.OPEN) {
			ws.addEventListener('close', () => {
				clearInterval(pingInterval)
				closeCallbacks.forEach((cb) => cb && cb())
			})
			ws.close()
		} else {
			log.info('WebSocket is not open, nothing to close.')
			if (callback) {
				callback()
			}
		}
	}

	if (enableWebSocket) {
		ws.onopen = () => {
			openCallbacks.forEach((cb) => cb())
			while (messageQueue.length > 0) {
				const { message, via } = messageQueue.shift()
				sendMessageToTargets(message, via)
			}

			// Handle local client connection (not inside iframe or Figma)
			// if (!(isInsideIframe || isInsideFigma)) {
			localClientConnected.set(true)
			// }

			pingInterval = window.setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(
						JSON.stringify({
							pluginMessage: { event: 'ping' },
							pluginId: '*',
						}),
					)
				}
			}, 10000)
		}

		ws.onmessage = (event) => {
			try {
				log.info('Received raw WebSocket message:', event.data)

				if (!event.data) {
					log.warn('Received empty message')
					return
				}

				let message
				try {
					message = JSON.parse(event.data)
					sendMessageToTargets(message, 'window')
				} catch (error) {
					log.warn('Failed to parse WebSocket message:', event.data)
					return
				}

				if (message.pluginMessage) {
					if (message.pluginMessage.event === 'ping') {
						ws.send(
							JSON.stringify({
								pluginMessage: { event: 'pong' },
								pluginId: '*',
							}),
						)
					}

					if (message.pluginMessage.event === 'client_list') {
						// if (!(isInsideIframe || isInsideFigma)) {
						const connectedClients = message.pluginMessage.clients || []
						const browserClientsX = connectedClients.filter((client) => client.source === 'browser')
						const pluginWindowClientsX = connectedClients.filter(
							(client) => client.source === 'plugin-window',
						)
						remoteClients.set(browserClientsX) // Set the connected clients
						pluginWindowClients.set(pluginWindowClientsX) // Set the connected clients
						// }
					}

					// Handle remote client connection and disconnection events
					if (message.pluginMessage.event === 'client_connected') {
						// console.log(`Client connected:`, message.pluginMessage.client)

						// Handle remote clients only when inside iframe or Figma
						// if (!(isInsideIframe || isInsideFigma)) {
						// 	console.log('----', message.pluginMessage.source)
						// 	// Only add browser
						// 	if (message.pluginMessage.source === 'browser') {
						if (message.pluginMessage.client.source === 'browser') {
							remoteClients.update((clients) => [...clients, message.pluginMessage.client])
						}

						if (message.pluginMessage.client.source === 'plugin-window') {
							pluginWindowClients.update((clients) => [...clients, message.pluginMessage.client])
						}
						// 	}
						// }
					} else if (message.pluginMessage.event === 'client_disconnected') {
						// console.log(`Client disconnected:`, message.pluginMessage.client)

						// Handle remote clients only when inside iframe or Figma
						// if (!(isInsideIframe || isInsideFigma)) {
						pluginWindowClients.update((clients) =>
							clients.filter((client) => client.id !== message.pluginMessage.client.id),
						)
						remoteClients.update((clients) =>
							clients.filter((client) => client.id !== message.pluginMessage.client.id),
						)
						// }
					}
				}
			} catch (error) {
				log.error('Error in message listener:', error)
			}
		}

		ws.onclose = () => {
			clearInterval(pingInterval)
			closeCallbacks.forEach((cb) => cb && cb())

			// Handle local client disconnection (not inside iframe or Figma)
			// if (!(isInsideIframe || isInsideFigma)) {
			localClientConnected.set(false)
			// }

			console.warn('WebSocket connection closed')
		}
	}

	return ws
}
