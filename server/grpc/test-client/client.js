const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const readline = require('readline');

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

// Create gRPC client
const client = new chatService.ChatService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// Setup readline interface for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Start chat
const startChat = () => {
    // Open bidirectional stream
    const stream = client.Chat();

    // Handle incoming messages
    stream.on('data', (message) => {
        console.log(`\n${message.userId}: ${message.content}`);
        rl.prompt();
    });

    // Handle end of stream
    stream.on('end', () => {
        console.log('Server ended chat');
        rl.close();
    });

    // Handle errors
    stream.on('error', (error) => {
        console.error('Error:', error);
        rl.close();
    });

    console.log('Connected to chat server. Type your messages (press Ctrl+C to exit):');
    rl.prompt();

    // Handle user input
    rl.on('line', (line) => {
        if (line.trim()) {
            stream.write({ content: line.trim() });
        }
        rl.prompt();
    });

    // Handle client exit
    rl.on('close', () => {
        stream.end();
        console.log('\nDisconnected from chat server');
        process.exit(0);
    });
};

startChat(); 