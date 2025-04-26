const WebSocket = require('ws');
const readline = require('readline');

// Create WebSocket client
const ws = new WebSocket('ws://localhost:8080');

// Setup readline interface for console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Handle connection open
ws.on('open', () => {
    console.log('Connected to chat server. Type your messages (press Ctrl+C to exit):');
    rl.prompt();
});

// Handle incoming messages
ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        if (message.type === 'system') {
            console.log(`\nSystem: ${message.content}`);
        } else {
            console.log(`\n${message.userId}: ${message.content}`);
        }
        rl.prompt();
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

// Handle connection close
ws.on('close', () => {
    console.log('\nDisconnected from chat server');
    rl.close();
    process.exit(0);
});

// Handle errors
ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    rl.close();
    process.exit(1);
});

// Handle user input
rl.on('line', (line) => {
    if (line.trim() && ws.readyState === WebSocket.OPEN) {
        ws.send(line.trim());
    }
    rl.prompt();
});

// Handle client exit
rl.on('close', () => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    console.log('\nDisconnected from chat server');
    process.exit(0);
}); 