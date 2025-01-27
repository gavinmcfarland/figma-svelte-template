import express, { Request, Response } from "express";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { parse } from "node:url";
import type { IncomingMessage } from "node:http";

const PORT = 9001;

interface Client {
	ws: WebSocket;
	source: string;
}

interface ClientInfo {
	id: string;
	source: string;
}

interface PluginMessage {
	event: string;
	message: string;
	clients?: ClientInfo[];
	client?: ClientInfo;
	source: string;
}

interface WebSocketMessage {
	pluginMessage: PluginMessage;
	pluginId: string;
	[key: string]: unknown;
}

interface ExtendedWebSocket extends WebSocket {
	isAlive: boolean;
	clientId: string;
}

const app = express();

app.get("/", (req: Request, res: Response) => {
	res.sendFile(join(process.cwd(), "/dist/ui.html")); // Serve the main HTML page
});

// Initialize a simple HTTP server
const server = createServer(app);

// Initialize the WebSocket server instance
const wss = new WebSocketServer({ server });

// Map to store clients with their unique IDs and other info
const clients = new Map<string, Client>();

// Function to broadcast messages to clients except the sender
function broadcastMessage(message: string, senderId: string): void {
	clients.forEach(({ ws }, clientId) => {
		if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
			ws.send(message);
		}
	});
}

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
	const clientId = uuidv4(); // Generate a unique ID for the client
	const extWs = ws as ExtendedWebSocket;

	// Extract the query parameters, specifically the "source" (e.g., "plugin-window")
	const queryParams = parse(req.url ?? "", true).query;
	const clientSource = (queryParams.source as string) || "unknown"; // Default to 'unknown' if no source provided

	// Store the WebSocket connection and the client source
	clients.set(clientId, { ws, source: clientSource });

	// Log the new connection with its source
	console.log(
		`New client connected: ${clientId} (Source: ${clientSource}), ${req.url}`,
	);

	// Send initial client list
	const initialMessage: WebSocketMessage = {
		pluginMessage: {
			event: "client_list",
			message: "List of connected clients",
			clients: Array.from(clients.entries()).map(([id, client]) => ({
				id,
				source: client.source,
			})),
			source: clientSource,
		},
		pluginId: "*",
	};

	ws.send(JSON.stringify(initialMessage));

	// Broadcast the new connection to all other clients
	const connectionMessage: WebSocketMessage = {
		pluginMessage: {
			event: "client_connected",
			message: `Client ${clientId} connected`,
			client: {
				id: clientId,
				source: clientSource,
			},
			source: clientSource,
		},
		pluginId: "*",
	};

	broadcastMessage(JSON.stringify(connectionMessage), clientId);

	// Set up initial client state
	extWs.isAlive = true;
	extWs.clientId = clientId;

	ws.on("pong", () => {
		extWs.isAlive = true;
	});

	ws.on("message", (message: Buffer | string, isBinary: boolean) => {
		const textMessage = isBinary ? message.toString() : message.toString();
		const parsedMessage = JSON.parse(textMessage) as WebSocketMessage;

		// Attach the source of the sender to the message
		const messageWithSource: WebSocketMessage = {
			...parsedMessage,
			source: clientSource,
		};

		broadcastMessage(JSON.stringify(messageWithSource), clientId);
	});

	ws.on("close", () => {
		clients.delete(clientId);
		console.log(`Client ${clientId} disconnected`);

		const disconnectMessage: WebSocketMessage = {
			pluginMessage: {
				event: "client_disconnected",
				message: `Client ${clientId} disconnected`,
				client: {
					id: clientId,
					source: clientSource,
				},
				source: clientSource,
			},
			pluginId: "*",
		};

		broadcastMessage(JSON.stringify(disconnectMessage), clientId);
	});
});

// Check connection status and send pings every 10 seconds
setInterval(() => {
	for (const ws of wss.clients) {
		const extWs = ws as ExtendedWebSocket;
		if (!extWs.isAlive) {
			console.log(`Terminating connection ${extWs.clientId}`);
			ws.terminate();
			continue;
		}
		extWs.isAlive = false;
		ws.ping();
	}
}, 10000);

server.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
