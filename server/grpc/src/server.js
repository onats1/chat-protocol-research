const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../../proto/chat.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const chatService = protoDescriptor.chat;

// Store active connections
const activeConnections = new Map();

// Implement the Chat service
const chat = (call) => {
    console.log('New client connected');
    
    // Generate a simple user ID
    const userId = `user_${Date.now()}`;
    activeConnections.set(userId, call);

    // Handle incoming messages
    call.on('data', (message) => {
        message.userId = userId;
        message.timestamp = Date.now();
        
        // Broadcast message to all connected clients
        activeConnections.forEach((clientCall, clientId) => {
            if (clientId !== userId) {
                clientCall.write(message);
            }
        });
    });

    // Handle client disconnect
    call.on('end', () => {
        console.log(`Client ${userId} disconnected`);
        activeConnections.delete(userId);
        call.end();
    });

    // Handle errors
    call.on('error', (error) => {
        console.error(`Error with client ${userId}:`, error);
        activeConnections.delete(userId);
    });
};

// Create and start gRPC server
const startServer = () => {
    const server = new grpc.Server();
    server.addService(chatService.ChatService.service, { Chat: chat });
    
    server.bindAsync(
        '0.0.0.0:50051',
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) {
                console.error('Failed to start server:', error);
                return;
            }
            server.start();
            console.log(`gRPC server running on port ${port}`);
        }
    );
};

startServer(); 