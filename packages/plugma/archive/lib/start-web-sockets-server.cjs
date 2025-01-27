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

wss.on('connection', (ws, req) => {
	const clientId = uuidv4(); // Generate a unique ID for the client

	// Extract the query parameters, specifically the "source" (e.g., "plugin-window")
	const queryParams = url.parse(req.url, true).query;
	const clientSource = queryParams.source || 'unknown'; // Default to 'unknown' if no source provided

	// Store the WebSocket connection and the client source
	clients.set(clientId, { ws, source: clientSource });

	// Log the new connection with its source
	console.log(`New client connected: ${clientId} (Source: ${clientSource}), ${req.url}`);

	// Send a list of all connected clients, excluding the new client
	// const otherClients = Array.from(clients.keys()).filter(id => id !== clientId);
	// const otherClients = Array.from(clients.entries())
	// 	.filter(([id, client]) =>
	// 		client.source === 'browser'
	// 	) // Filter by clientId and source 'browser'
	// 	.map(([id, client]) => ({ id, source: client.source }));

	ws.send(JSON.stringify({
		pluginMessage: {
			event: 'client_list',
			message: 'List of connected clients',
			clients: Array.from(clients.entries()).map(([id, client]) => ({ id, source: client.source })),
			source: clientSource, // Add the source to the message
		},
		pluginId: "*"
	}));

	// Broadcast the new connection to all other clients

	broadcastMessage(JSON.stringify({
		pluginMessage: {
			event: 'client_connected',
			message: `Client ${clientId} connected`,
			client: {
				id: clientId,
				source: clientSource
			},
			source: clientSource, // Include the source in the broadcast message
		},
		pluginId: "*"
	}), clientId);



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
			source: clientSource // Include the client source in the outgoing message
		};

		// Broadcast the message with source to other clients
		broadcastMessage(JSON.stringify(messageWithSource), clientId);
	});

	ws.on('close', () => {
		clients.delete(clientId); // Remove the client on disconnect
		console.log(`Client ${clientId} disconnected`);

		let message = JSON.stringify({
			pluginMessage: {
				event: 'client_disconnected',
				message: `Client ${clientId} disconnected`,
				client: {
					id: clientId,
					source: clientSource
				},
				source: clientSource, // Include the source in the disconnection message
			},
			pluginId: "*"
		});

		// Broadcast the disconnection to all remaining clients
		broadcastMessage(message, clientId);
	});
});

// Function to broadcast messages to clients except the sender
function broadcastMessage(message, senderId) {
	clients.forEach(({ ws }, clientId) => {
		if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
}

// Check connection status and send pings every 10 seconds
setInterval(() => {
	wss.clients.forEach(ws => {
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
