const express = require('express'); //Important for api and web server in node
const http = require('http');           // ADD: For Socket.IO
const socketIo = require('socket.io');  // ADD: Socket.IO
const connectDB = require('./config/db'); // Important for Database
const dotenv = require('dotenv');
const config = require('config');
const cors = require('cors');
const metadataRoutes = require('./routes/metadata');

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express(); //To create express app and will listen to requests adn deal with it
app.use(cors());

//Middleware
app.use(express.json());

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity; adjust as needed
    methods: ['GET', 'POST'],
  },
});

// Connect Database
connectDB();

//app.use(cors());

// Define Routes
const accApprovalRoute = require('./routes/accApproval');
const usersRoute = require('./routes/users');
app.use('/api/metadata', metadataRoutes);
app.use('/api/users', usersRoute);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/getClubs', require('./routes/clubs'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/mentorApproval', require('./routes/accApproval'));
app.use('/api/chat', require('./routes/chat')); // ADD: Chat routes

// ADD: Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins a chat room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // User leaves a chat room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Handle sending messages
  socket.on('send-message', (messageData) => {
    console.log('Message received:', messageData);
    
    // Broadcast message to all users in the room
    socket.to(messageData.chatId).emit('new-message', messageData);
    
    // Also send back to sender for confirmation
    socket.emit('message-sent', messageData);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', data);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

//Root Routes
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

//start the server - UPDATED: Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => console.log(`Server started on port ${PORT} with Socket.IO`));