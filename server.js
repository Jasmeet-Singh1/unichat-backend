const express = require('express'); //Important for api and web server in node
const connectDB = require('./config/db'); // Important for Database
const dotenv = require('dotenv');
const config = require('config');
const cors = require('cors');

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express(); //To create express app and will listen to requests adn deal with it
app.use(cors());


//Middleware
app.use(express.json());

// Connect Database
connectDB();

// Define Routes

const accApprovalRoute = require('./routes/accApproval');
const usersRoute = require('./routes/users');
app.use('/api/users', usersRoute);
app.use('/api/auth', require('./routes/auth'));//realated to authentication 
app.use('/api/getClubs', require('./routes/clubs'));//get clubs from db
app.use('/api/programs', require('./routes/programs'));// get programs from db
app.use('/api/mentorApproval', require('./routes/accApproval')); //related to admin approving mentor accounts
app.use('/api/profile', require('./routes/updateProfile'));//edit user profile details (student and mentor)

//Root Routes
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

//start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
