const express = require('express');
const router = express.Router();

// Import both controller functions
const { getUserProfile, updateUserProfile } = require('../controllers/updateProfileController');

const protect = require('../middleware/auth');

// GET request to fetch profile
router.get('/profile', protect, getUserProfile);

// PUT request to update profile
router.put('/profile', protect, updateUserProfile);

module.exports = router;
