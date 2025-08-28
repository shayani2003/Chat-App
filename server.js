const express = require('express');
const app = express();
const http = require('http').createServer(app);

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.io setup
const io = require('socket.io')(http);



io.on('connection', (socket) => {
    console.log('connected...');

    // When a new user joins, ask them to send their name
    socket.on('new-user-joined', (name) => {
        socket.username = name;  // store user name in socket
        socket.broadcast.emit('message', { user: "System", message: `${name} joined the chat` });
    });

    // Normal chat message
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg);
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        if (socket.username) {
            socket.broadcast.emit('message', { user: "System", message: `${socket.username} left the chat` });
        }
    });
});
