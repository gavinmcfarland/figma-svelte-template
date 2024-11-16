const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique client IDs
const url = require('url'); // Used to parse query parameters

const PORT = 9001;

const app = express();

app.get('/', (req, res) => {
	res.sendFile(path.join(process.cwd() + '/dist/ui.html')); // Serve the main HTML page
});

// Initialize a simple HTTP server
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// Map to store clients with their unique IDs and other info
const clients = new Map();

// Queues for storing messages for each source type
const messageQueues = {
	browser: [],
	'plugin-window': [],
	unknown: [],
};

wss.on('connection', (ws, req) => {
	const clientId = uuidv4(); // Generate a unique ID for the client

	// Extract the query parameters, specifically the "source" (e.g., "plugin-window")
	const queryParams = url.parse(req.url, true).query;
	const clientSource = queryParams.source || 'unknown'; // Default to 'unknown' if no source provided

	// Store the WebSocket connection and the client source
	clients.set(clientId, { ws, source: clientSource });

	// Log the new connection with its source
	console.log(`New client connected: ${clientId} (Source: ${clientSource}), ${req.url}`);

	// Send a list of all connected clients to the new client
	ws.send(
		JSON.stringify({
			pluginMessage: {
				event: 'client_list',
				message: 'List of connected clients',
				clients: Array.from(clients.entries()).map(([id, client]) => ({
					id,
					source: client.source,
				})),
				source: clientSource,
			},
			pluginId: '*',
		})
	);

	// Flush queued messages for this client source
	flushQueue(clientSource);

	// Broadcast the new connection to all other clients
	broadcastMessage(
		JSON.stringify({
			pluginMessage: {
				event: 'client_connected',
				message: `Client ${clientId} connected`,
				client: { id: clientId, source: clientSource },
				source: clientSource,
			},
			pluginId: '*',
		}),
		clientId,
		clientSource
	);

	// Set up initial client state
	ws.isAlive = true;
	ws.clientId = clientId; // Assign clientId to ws object for easy access

	ws.on('pong', () => {
		ws.isAlive = true; // Update client status on pong response
	});

	// Handle incoming messages from this client
	ws.on('message', (message, isBinary) => {
		const textMessage = isBinary ? message : message.toString();
		const parsedMessage = JSON.parse(textMessage);

		// Attach the source of the sender to the message
		const messageWithSource = {
			...parsedMessage,
			source: clientSource, // Include the client source in the outgoing message
		};

		// Broadcast the message with source to other clients
		broadcastMessage(JSON.stringify(messageWithSource), clientId, clientSource);
	});

	ws.on('close', () => {
		clients.delete(clientId); // Remove the client on disconnect
		console.log(`Client ${clientId} disconnected`);

		const disconnectMessage = JSON.stringify({
			pluginMessage: {
				event: 'client_disconnected',
				message: `Client ${clientId} disconnected`,
				client: { id: clientId, source: clientSource },
				source: clientSource,
			},
			pluginId: '*',
		});

		// Broadcast the disconnection to all remaining clients
		broadcastMessage(disconnectMessage, clientId, clientSource);
	});
});

// Function to broadcast messages between specific sources
function broadcastMessage(message, senderId, senderSource) {
	const targetSource = senderSource === 'browser' ? 'plugin-window' : 'browser';
	const parsedMessage = JSON.parse(message);

	// Exclude messages with specific events from being queued
	if (
		parsedMessage.pluginMessage?.event === 'client_connected' ||
		parsedMessage.pluginMessage?.event === 'client_disconnected' ||
		parsedMessage.pluginMessage?.event === 'ping' ||
		parsedMessage.pluginMessage?.event === 'pong'
	) {
		console.log(`Skipping queue for event: ${parsedMessage.pluginMessage.event}`);
	} else {
		let sent = false;

		clients.forEach(({ ws, source }, clientId) => {
			if (clientId !== senderId && source === targetSource) {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(message);
					console.log(`Message sent directly to client ${clientId} (source: ${source})`, message);
					sent = true;
				}
			}
		});

		// Queue the message if no target clients are currently connected
		if (!sent) {
			console.log(`No active ${targetSource} clients, queuing message:`, message);
			messageQueues[targetSource].push(message);
		}
	}
}

// Function to flush the message queue for a specific source type

function flushQueue(targetSource) {
	const targetClients = Array.from(clients.values()).filter(
		(client) => client.source === targetSource && client.ws.readyState === WebSocket.OPEN
	);

	if (targetClients.length > 0) {
		console.log(`Flushing ${messageQueues[targetSource].length} messages to ${targetSource} clients`);

		// Remove excluded messages from the queue before sending
		messageQueues[targetSource] = messageQueues[targetSource].filter((msg) => {
			const parsedMessage = JSON.parse(msg);

			if (
				parsedMessage.pluginMessage?.event === 'client_connected' ||
				parsedMessage.pluginMessage?.event === 'client_disconnected' ||
				parsedMessage.pluginMessage?.event === 'ping' ||
				parsedMessage.pluginMessage?.event === 'pong'
			) {
				console.log(`Skipping queue flush for event: ${parsedMessage.pluginMessage.event}`);
				return false; // Exclude these messages from the queue
			}

			return true;
		});

		targetClients.forEach((client) => {
			messageQueues[targetSource].forEach((msg) => {
				client.ws.send(msg);
				console.log(`Message from queue sent to ${client.source} client:`, msg);
			});
		});

		messageQueues[targetSource] = []; // Clear the queue after flushing
	}
}

// Check connection status and send pings every 10 seconds
setInterval(() => {
	wss.clients.forEach((ws) => {
		if (!ws.isAlive) {
			console.log(`Terminating connection ${ws.clientId}`);
			return ws.terminate();
		}
		ws.isAlive = false;
		ws.ping(); // Send ping to check if the connection is still alive
	});
}, 10000);

server.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
