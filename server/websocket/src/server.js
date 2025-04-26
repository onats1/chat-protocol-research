const WebSocket = require('ws');
const express = require('express');
const http = require('http');

// Create express app and http server
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections
const activeConnections = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Generate a simple user ID
    const userId = `user_${Date.now()}`;
    activeConnections.set(userId, ws);

    // Send initial connection message
    ws.send(JSON.stringify({
        type: 'system',
        content: `Connected as ${userId}`
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            // Parse the incoming message
            const message = {
                userId: userId,
                content: data.toString(),
                timestamp: Date.now()
            };

            // Broadcast message to all other clients
            activeConnections.forEach((client, clientId) => {
                if (clientId !== userId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log(`Client ${userId} disconnected`);
        activeConnections.delete(userId);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`Error with client ${userId}:`, error);
        activeConnections.delete(userId);
    });
});

// Start server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
}); 