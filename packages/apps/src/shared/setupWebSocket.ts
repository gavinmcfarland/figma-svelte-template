import ReconnectingWebSocket from 'reconnecting-websocket'
import { Log } from '../../../plugma/lib/logger'
import { localClientConnected, remoteClients, localClientId } from './stores' // Import the Svelte stores
import { get } from 'svelte/store'
import { v4 as uuidv4 } from 'uuid' // Generate client-side UUID

const log = new Log({
	debug: window.runtimeData.debug,
})

interface ExtendedWebSocket extends ReconnectingWebSocket {
	post: (messages: any, via: any) => void
	on: (callback: any, via: any) => void
	open: (callback: () => void) => void
	close: (callback?: () => void) => void
}

export function setupWebSocket(
	iframeTarget = null,
	enableWebSocket = true,
	isInsideIframe = false,
	isInsideFigma = false
): ExtendedWebSocket | typeof mockWebSocket {
	const messageQueue: any[] = []
	let openCallbacks: (() => void)[] = []
	let closeCallbacks: (() => void)[] = []
	let pingInterval: number

	// Generate the clientId on the client side
	const clientId = uuidv4()

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
			console.warn('WebSocket is disabled, no connection to close.')
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
			iframeTarget.contentWindow.postMessage(message, '*')
		} else if (via === 'parent' && window.parent) {
			window.parent.postMessage(message, '*')
		} else if (via === 'ws') {
			if (enableWebSocket) {
				if (!ws || ws.readyState !== WebSocket.OPEN) {
					console.warn('WebSocket is disabled or not open, queuing message:', message)
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
			ws.addEventListener('message', async (event) => {
				let messageText

				// Check if the message is a Blob
				if (event.data instanceof Blob) {
					messageText = await event.data.text() // Convert Blob to text
				} else {
					messageText = event.data // Handle text data
				}

				let parsedData
				try {
					parsedData = JSON.parse(messageText) // Attempt to parse the message as JSON
					const newEvent = { ...event, data: parsedData }
					callback(newEvent)
					handleWebSocketMessage(parsedData) // Call the handler for specific message events
				} catch (error) {
					console.error('Failed to parse WebSocket message data:', error)
					callback(event) // If parsing fails, pass the raw event to the callback
				}
			})
		} else {
			console.warn(`Cannot add message listener via ${via}.`)
		}
	}

	function handleWebSocketMessage(message) {
		if (message.pluginMessage) {
			if (message.pluginMessage.event === 'pong') {
				log.info('Received pong from server')
			}

			if (message.pluginMessage.event === 'client_list') {
				const connectedClients = message.pluginMessage.clients || []
				remoteClients.set(connectedClients)
			}

			// Handle client connection and disconnection events
			if (message.pluginMessage.event === 'client_connected') {
				remoteClients.update((clients) => [...clients, message.pluginMessage.clientId])
			} else if (message.pluginMessage.event === 'client_disconnected') {
				remoteClients.update((clients) =>
					clients.filter((clientId) => clientId !== message.pluginMessage.clientId)
				)
			}
		}
	}

	if (!enableWebSocket || !('WebSocket' in window)) {
		return mockWebSocket
	}

	let ws = new ReconnectingWebSocket('ws://localhost:9001/ws') as ExtendedWebSocket

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

			ws.send(
				JSON.stringify({
					pluginMessage: { event: 'client_connected', clientId },
					pluginId: '*',
				})
			)

			pingInterval = window.setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(
						JSON.stringify({
							pluginMessage: { event: 'ping' },
							pluginId: '*',
						})
					)
				}
			}, 10000) // Ping server every 10 seconds
		}
	}

	return ws
}
