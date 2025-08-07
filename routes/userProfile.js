const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');  
const profileController = require('../controllers/userProfileController');
router.get('/current', authMiddleware, (req, res) => {
  // Reuse the same controller but pass the logged-in user's ID
  req.params.userId = req.user.userId;
  profileController.getUserProfile(req, res);
});
// GET user profile by ID
// Protected route: user must be logged in (token required)
router.get('/:userId', authMiddleware, profileController.getUserProfile);

module.exports = router;
