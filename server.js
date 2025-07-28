const express = require('express'); //Important for api and web server in node
const connectDB = require('./config/db'); // Important for Database
const dotenv = require('dotenv');
const config = require('config');
const accApprovalRoute = require('./routes/accApproval');
const alumniRoutes = require('./apiDB/alumniRouter');// this is for the alumni API
const app = express(); //To create express app and will listen to requests adn deal with it
const PORT = process.env.PORT || 5000;
const mentorRoutes = require('./apiDB/mentorRouter');// this is for mentor API
const chatRoutes = require("./apiDB/chatRouter");// this is for chat
const notificationRoutes = require('./apiDB/notificationRouter');// for notification


dotenv.config();

//Middleware
app.use(express.json());

// Connect Database
connectDB();

//Middleware to parse JSON body
app.use(express.json());

// Define Routes

app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/getClubs', require('./routes/clubs'));//auto populate
app.use('/api/programs', require('./routes/programs'));// auto populate
app.use('/api/mentorApproval', require('./routes/accApproval'));
app.use('/api/alumni', require('./apiDB/alumniRouter'));// for alumni API
app.use('/api/mentors',require('./apiDB/mentorRouter'));// for mentor API
app.use("/api/chat", require('./apiDB/chatRouter')); // for chat API
app.use('/api/notifications', require('./apiDB/notificationRouter')); // for notification API
app.use('/api/users', require('./apiDB/userRoutes'));
app.use('/api/events', require('./apiDB/eventRouter')); // or wherever your event route file is




//Root Routes
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

//start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

require('./cronJob/reminderJob');





