const express = require('express');
const router = express.Router();

const updateUserProfile = require('../controllers/updateProfileController');
const protect = require('../middleware/auth'); 


router.put('/profile', protect, updateUserProfile);

module.exports = router;
