const express = require('express');
const router = express.Router();
const { SignUp, Login } = require('../controllers/authController');

// Route for Student (and other roles) Registration
router.post('/register', SignUp);

// Route for User Login
router.post('/login', Login);

module.exports = router;

