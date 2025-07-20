const express = require('express'); //Important for api and web server in node
const connectDB = require('./config/db'); // Important for Database

const app = express(); //To create express app and will listen to requests adn deal with it
const PORT = process.env.PORT || 5000;

// Connect server to database
connectDB();

//Middleware to parse JSON body
app.use(express.json());

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/getClubs', require('./routes/clubs'));
app.use('/api/programs', require('./routes/programs'));

//Root Routes
app.get('/', (req, res) => res.json({ msg: 'Welcome to UniChat API...' }));

//start the server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));