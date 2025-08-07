const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth'); // Your auth middleware

// Debugging: Log the path of the searchController
console.log('Search controller path:', require('path').resolve('../controllers/searchController'));
// Test route to verify that the router is working
router.get('/test', (req, res) => res.send('Route test works'));

// These routes will be mounted under /api/search in your main app
// So router.get('/users/all') becomes /api/search/users/all

// Get all users - /api/search/users/all
router.get('/users/all', auth, searchController.getAllUsers);

// Search users with filters - /api/search/users?q=john&role=Mentor
router.get('/users', auth, searchController.searchUsers);

// Get specific user profile - /api/search/users/:userId
router.get('/users/:userId', auth, searchController.getUserProfile);

// Additional mentor search if needed - /api/search/mentors/by-course
router.get('/mentors/by-course', auth, searchController.searchMentorsByCourse);

module.exports = router;