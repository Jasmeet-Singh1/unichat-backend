const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');  
const profileController = require('../controllers/userProfileController');

// GET user profile by ID
// Protected route: user must be logged in (token required)
router.get('/:userId', authMiddleware, profileController.getUserProfile);

module.exports = router;
