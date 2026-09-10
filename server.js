
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_MESSAGE_LENGTH = 1000;


// =====================================================
// TEMPORARY IN-MEMORY STORAGE
// =====================================================

const users = new Map();
const groups = new Map();


// Default group
groups.set('General', new Set());


// =====================================================
// EXPRESS
// =====================================================

// Serve files from project root
app.use(express.static(__dirname));

// Also serve files from public folder if it exists
app.use(express.static(__dirname + '/public'));


// Open index.html
app.get('/', (req, res) => {

    res.sendFile(
        __dirname + '/index.html'
    );

});


// =====================================================
// GET ONLINE USERS
// =====================================================

function getOnlineUsers() {

    return [...users.values()].map(user => ({

        id: user.id,

        name: user.name

    }));

}


// =====================================================
// GET GROUPS
// =====================================================

function getGroups() {

    return [...groups.keys()];

}


// =====================================================
// SYSTEM MESSAGE
// =====================================================

function sendSystemMessageToRoom(
    room,
    message
) {

    io.to(room).emit(
        'system-message',
        {
            message,

            timestamp:
                new Date().toISOString()
        }
    );

}


// =====================================================
// MESSAGE VALIDATION
// =====================================================

function isValidMessage(message) {

    return (
        typeof message === 'string' &&
        message.trim().length > 0 &&
        message.trim().length <= MAX_MESSAGE_LENGTH
    );

}


// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

io.on('connection', (socket) => {

    console.log(
        `Connected: ${socket.id}`
    );


    // =================================================
    // NEW USER JOINED
    // =================================================

    socket.on(
        'new-user-joined',
        (rawName, callback) => {

            const name =
                typeof rawName === 'string'
                    ? rawName.trim().slice(0, 30)
                    : '';


            if (!name) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Name is required.'

                    });

                }

                return;

            }


            // Save username
            socket.username = name;


            // Every user starts in General
            socket.currentGroup =
                'General';


            // Store user
            users.set(
                socket.id,
                {
                    id: socket.id,

                    name: name
                }
            );


            // Add user to General
            groups
                .get('General')
                .add(socket.id);


            socket.join('General');


            console.log(
                `${name} joined`
            );


            // Send group list
            socket.emit(
                'group-list',
                getGroups()
            );


            // Send online users
            socket.emit(
                'online-users',
                getOnlineUsers()
            );


            // Update everyone
            io.emit(
                'online-users',
                getOnlineUsers()
            );


            // Tell other users
            socket.broadcast.emit(
                'user-status',
                {
                    name: name,

                    status: 'online',

                    timestamp:
                        new Date().toISOString()
                }
            );


            // System message
            sendSystemMessageToRoom(
                'General',

                `${name} joined General`
            );


            // Callback
            if (callback) {

                callback({

                    ok: true,

                    userId:
                        socket.id

                });

            }

        }
    );


    // =================================================
    // PRIVATE MESSAGE
    // =================================================

    socket.on(
        'private-message',
        ({ to, message }, callback) => {

            if (!socket.username) {

                return;

            }


            if (
                !to ||
                !users.has(to)
            ) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'User is offline or does not exist.'

                    });

                }

                return;

            }


            if (!isValidMessage(message)) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Message must contain 1-1000 characters.'

                    });

                }

                return;

            }


            const msg = {

                id:
                    crypto.randomUUID(),

                type:
                    'private',

                from:
                    socket.id,

                fromName:
                    socket.username,

                to:

                    to,

                message:
                    message.trim(),

                timestamp:
                    new Date().toISOString()

            };


            // Send to receiver
            io.to(to).emit(
                'private-message',
                msg
            );


            // Confirm to sender
            socket.emit(
                'message-sent',
                msg
            );


            if (callback) {

                callback({

                    ok: true,

                    messageId:
                        msg.id

                });

            }

        }
    );


    // =================================================
    // READ RECEIPT
    // =================================================

    socket.on(
        'message-read',
        ({ messageId, from }) => {

            if (
                !messageId ||
                !from
            ) {

                return;

            }


            if (!users.has(from)) {

                return;

            }


            io.to(from).emit(
                'message-read',
                {

                    messageId:
                        messageId,

                    readBy:
                        socket.id,

                    readAt:
                        new Date().toISOString()

                }
            );

        }
    );


    // =================================================
    // CREATE GROUP
    // =================================================

    socket.on(
        'create-group',
        (rawGroupName, callback) => {

            if (!socket.username) {

                return;

            }


            const groupName =
                typeof rawGroupName === 'string'
                    ? rawGroupName
                        .trim()
                        .slice(0, 40)
                    : '';


            if (!groupName) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Group name is required.'

                    });

                }

                return;

            }


            if (groups.has(groupName)) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'A group with this name already exists.'

                    });

                }

                return;

            }


            // Create group
            groups.set(
                groupName,
                new Set()
            );


            // Update everyone
            io.emit(
                'group-list',
                getGroups()
            );


            if (callback) {

                callback({

                    ok: true,

                    groupName:
                        groupName

                });

            }

        }
    );


    // =================================================
    // JOIN GROUP
    // =================================================

    socket.on(
        'join-group',
        (groupName, callback) => {

            if (!socket.username) {

                return;

            }


            if (!groups.has(groupName)) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Group does not exist.'

                    });

                }

                return;

            }


            const oldGroup =
                socket.currentGroup;


            // Leave old group
            if (
                oldGroup &&
                groups.has(oldGroup)
            ) {

                groups
                    .get(oldGroup)
                    .delete(socket.id);


                socket.leave(
                    oldGroup
                );


                sendSystemMessageToRoom(
                    oldGroup,

                    `${socket.username} left the group`
                );

            }


            // Join new group
            socket.currentGroup =
                groupName;


            groups
                .get(groupName)
                .add(socket.id);


            socket.join(
                groupName
            );


            sendSystemMessageToRoom(
                groupName,

                `${socket.username} joined the group`
            );


            if (callback) {

                callback({

                    ok: true,

                    groupName:
                        groupName

                });

            }

        }
    );


    // =================================================
    // GROUP MESSAGE
    // =================================================

    socket.on(
        'group-message',
        ({ groupName, message }, callback) => {

            if (!socket.username) {

                return;

            }


            if (
                !groups.has(groupName) ||
                socket.currentGroup !== groupName
            ) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Join this group before sending messages.'

                    });

                }

                return;

            }


            if (!isValidMessage(message)) {

                if (callback) {

                    callback({

                        ok: false,

                        error:
                            'Message must contain 1-1000 characters.'

                    });

                }

                return;

            }


            const msg = {

                id:
                    crypto.randomUUID(),

                type:
                    'group',

                groupName:
                    groupName,

                from:
                    socket.id,

                fromName:
                    socket.username,

                message:
                    message.trim(),

                timestamp:
                    new Date().toISOString()

            };


            // Send to everyone in group
            io.to(groupName).emit(
                'group-message',
                msg
            );


            if (callback) {

                callback({

                    ok: true,

                    messageId:
                        msg.id

                });

            }

        }
    );


    // =================================================
    // TYPING INDICATOR
    // =================================================

    socket.on(
        'typing',
        ({ mode, to, groupName, isTyping }) => {

            if (!socket.username) {

                return;

            }


            // Private chat
            if (
                mode === 'private' &&
                to &&
                users.has(to)
            ) {

                io.to(to).emit(
                    'typing',
                    {

                        mode:
                            'private',

                        from:
                            socket.id,

                        name:
                            socket.username,

                        isTyping:
                            Boolean(isTyping)

                    }
                );

            }


            // Group chat
            else if (
                mode === 'group' &&
                groupName === socket.currentGroup &&
                groups.has(groupName)
            ) {

                socket
                    .to(groupName)
                    .emit(
                        'typing',
                        {

                            mode:
                                'group',

                            from:
                                socket.id,

                            name:
                                socket.username,

                            groupName:
                                groupName,

                            isTyping:
                                Boolean(isTyping)

                        }
                    );

            }

        }
    );


    // =================================================
    // DISCONNECT
    // =================================================

    socket.on(
        'disconnect',
        () => {

            if (!socket.username) {

                return;

            }


            const name =
                socket.username;


            const groupName =
                socket.currentGroup;


            // Remove user
            users.delete(
                socket.id
            );


            // Remove from group
            if (
                groupName &&
                groups.has(groupName)
            ) {

                groups
                    .get(groupName)
                    .delete(socket.id);


                sendSystemMessageToRoom(
                    groupName,

                    `${name} went offline`
                );

            }


            // Update online users
            io.emit(
                'online-users',
                getOnlineUsers()
            );


            // Tell other users
            socket.broadcast.emit(
                'user-status',
                {

                    name:
                        name,

                    status:
                        'offline',

                    timestamp:
                        new Date().toISOString()

                }
            );


            console.log(
                `Disconnected: ${socket.id}`
            );

        }
    );

});


// =====================================================
// START SERVER
// =====================================================

server.listen(
    PORT,
    () => {

        console.log(
            '========================================'
        );

        console.log(
            `Talking Chat App running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            '========================================'
        );

    }
);

