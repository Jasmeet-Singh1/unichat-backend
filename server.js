const express = require('express'); //Important for api and web server in node
const connectDB = require('./config/db'); // Important for Database
const dotenv = require('dotenv');
const config = require('config');

const accApprovalRoute = require('./routes/accApproval');
const cors = require('cors');

const app = express(); //To create express app and will listen to requests adn deal with it
const PORT = process.env.PORT || 5000;

dotenv.config();

//Middleware
app.use(express.json());

// Connect Database
connectDB();

app.use(cors());

//Middleware to parse JSON body
app.use(express.json());

// Define Routes

app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/getClubs', require('./routes/clubs'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/programs/:id', require('./routes/programs'));
app.use('/api/programs/:id/courses', require('./routes/programs'));
app.use('/api/mentorApproval', require('./routes/accApproval'));
app.use('/api/userProfile', require('./routes/userProfile'));
app.use('/api/profile', require('./routes/updateProfile'));
//Root Routes
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

//start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

require('./cronJob/reminderJob');
