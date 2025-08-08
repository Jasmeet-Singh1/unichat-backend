const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001; // Changed to 3001 for frontend

dotenv.config();

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// Connect Database
connectDB();

// Store online users
const onlineUsers = new Map();
const userSockets = new Map();

// Routes
const authMiddleware = require('./middleware/auth'); // Your existing auth middleware


app.use('/api/users', require('./routes/users'));
app.use('/api/chat', authMiddleware, require('./routes/chatRouter')); // Use your existing auth middleware
app.use('/api/getClubs', require('./routes/clubs'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/mentorApproval', require('./routes/accApproval'));


app.use('/api/userProfile', require('./routes/userProfile'));
app.use('/api/profile', require('./routes/updateProfile'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', authMiddleware, require('./routes/notificationRouter'));
app.use('/api/groups', authMiddleware, require('./routes/group'));

// Socket.IO implementation
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with authentication
    socket.on('user-join', async (data) => {
        try {
            const { userId, userName, token } = data;
            
            // You can verify token here if needed
            socket.userId = userId;
            socket.userName = userName;
            onlineUsers.set(userId, socket.id);
            userSockets.set(socket.id, userId);
            
            // Broadcast user online
            socket.broadcast.emit('user-online', userId);
            
            // Send current online users
            io.emit('online-users', Array.from(onlineUsers.keys()));
            
        } catch (error) {
            console.error('Error in user-join:', error);
            socket.emit('error', { message: 'Failed to join' });
        }
    });

    // Join room
    socket.on('join-room', (chatId) => {
        socket.join(chatId);
        console.log(`User ${socket.userId} joined room ${chatId}`);
    });

    // Leave room
    socket.on('leave-room', (chatId) => {
        socket.leave(chatId);
        console.log(`User ${socket.userId} left room ${chatId}`);
    });

    // Handle messages
    socket.on('send-message', (messageData) => {
        // Broadcast to room
        io.to(messageData.chatId).emit('new-message', {
            id: messageData.id,
            text: messageData.text,
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            timestamp: messageData.timestamp,
            chatId: messageData.chatId,
            type: messageData.type || 'text'
        });
    });

    // Typing indicators
    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            chatId: data.chatId
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            userSockets.delete(socket.id);
            socket.broadcast.emit('user-offline', socket.userId);
            io.emit('online-users', Array.from(onlineUsers.keys()));
        }
        console.log('User disconnected:', socket.id);
    });
});

// Root route
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

// Start server with Socket.IO
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Socket.IO enabled for real-time chat`);
});

require('./cronJob/reminderJob');