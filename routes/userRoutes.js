const express = require('express');
const router = express.Router();
const User = require('../models/user'); 

// GET /api/users - returns all users with their _id, name, and email
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName email'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
