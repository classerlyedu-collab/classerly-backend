const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatSession = require('./models/chat');

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "*",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded.id;
            socket.userType = decoded.userType;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userType})`);

        // Join a specific chat room
        socket.on('join-chat', (sessionId) => {
            socket.join(`chat-${sessionId}`);
            console.log(`User ${socket.userId} joined chat session: ${sessionId}`);
        });

        // Leave a chat room
        socket.on('leave-chat', (sessionId) => {
            socket.leave(`chat-${sessionId}`);
            console.log(`User ${socket.userId} left chat session: ${sessionId}`);
        });

        // Handle new message
        socket.on('new-message', async (data) => {
            try {
                const { sessionId, message, senderId } = data;

                // Emit to all users in the chat room
                io.to(`chat-${sessionId}`).emit('message-received', {
                    sessionId,
                    message,
                    senderId,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Error handling new message:', error);
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            socket.to(`chat-${data.sessionId}`).emit('user-typing', {
                sessionId: data.sessionId,
                userId: socket.userId
            });
        });

        // Handle stop typing
        socket.on('stop-typing', (data) => {
            socket.to(`chat-${data.sessionId}`).emit('user-stop-typing', {
                sessionId: data.sessionId,
                userId: socket.userId
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };
