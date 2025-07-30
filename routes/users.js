const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SignUp } = require('../controllers/authController');

// POST register route
router.post('/register', SignUp);

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        message: 'User not found',
      });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(400).json({
        message: 'Invalid credentials',
      });

    if (!user.isVerified) {
      return res.status(401).json({
        message: 'User not verified. Please verify your email first.',
      });
    }

    if (user.role === 'mentor' && user.isApproved === false) {
      return res.status(403).json({
        message: 'Your account is awaiting admin approval.',
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;
