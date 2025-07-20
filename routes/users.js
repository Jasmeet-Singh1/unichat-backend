// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { updateUserProfile } = require('../controllers/userController');
//const auth = require('../middleware/auth');   ADD THIS WHEN AUTHENTICATION IS IMPLEMENTED. 
//temporary is 
router.put('/profile', updateUserProfile);

//when authentication is ready
//router.put('/profile', auth, updateUserProfile);

module.exports = router;
