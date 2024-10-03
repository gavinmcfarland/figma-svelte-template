const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const PORT = 9001;
const app = express();

app.get('/', (req, res) => {
	res.sendFile(path.join(process.cwd() + '/dist/ui.html'));
});

// Initialize a simple HTTP server
const server = http.createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// Store clients
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
	const clientId = uuidv4(); // Generate unique client ID
	clients.set(clientId, ws); // Store client WebSocket connection with its ID
	ws.isAlive = true; // Mark connection as alive

	// Send clientId back to the client
	ws.send(JSON.stringify({
		pluginMessage: {
			event: 'client_connected',
			clientId,
		},
		pluginId: '*',
	}));

	// Send a list of all clients
	const otherClients = Array.from(clients.keys()).filter(id => id !== clientId);
	ws.send(JSON.stringify({
		pluginMessage: {
			event: 'client_list',
			message: 'List of connected clients',
			clients: otherClients,
		},
		pluginId: "*"
	}));

	// Broadcast the new connection to other clients
	broadcastMessage({
		pluginMessage: {
			event: 'client_connected',
			clientId,
		},
		pluginId: '*',
	}, clientId);

	// Listen for ping-pong
	ws.on('pong', () => {
		ws.isAlive = true; // Mark as alive on pong response
	});

	// Listen for client messages
	ws.on('message', (message) => {
		// Handle incoming messages here
		console.log(`Received message: ${message}`);
	});

	// Handle client disconnection
	ws.on('close', () => {
		clients.delete(clientId);
		broadcastMessage({
			pluginMessage: {
				event: 'client_disconnected',
				clientId,
			},
			pluginId: '*',
		}, clientId);
	});
});

// Periodic ping to check if clients are alive
setInterval(() => {
	wss.clients.forEach(ws => {
		if (!ws.isAlive) {
			// Client did not respond to ping, terminate connection
			ws.terminate();
		} else {
			ws.isAlive = false;
			ws.ping(); // Send ping to client
		}
	});
}, 10000); // 10 seconds interval for ping

// Broadcast message to all clients except the sender
function broadcastMessage(message, senderId) {
	const jsonMessage = JSON.stringify(message);
	clients.forEach((client, clientId) => {
		if (client.readyState === WebSocket.OPEN && clientId !== senderId) {
			client.send(jsonMessage);
		}
	});
}

server.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
