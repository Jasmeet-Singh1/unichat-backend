const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/OTP');
const sendOtpEmail = require('../utils/sendOtpEmail');
const { updateUserProfile } = require('../controllers/userController');

// Step 1: Initial Student registration and OTP send
router.post('/register', async (req, res) => {
  const { firstName, lastName, role, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists. Please login.' });
    }

    const user = new User({
      firstName,
      lastName,
      role,
      username,
      email,
      password,
      isVerified: false,
    });

    await user.save();

    if (!/^[^\s@]+@student\.kpu\.ca$/i.test(email)) {
      return res.status(400).json({ message: 'Only KPU emails are allowed.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate({ email }, { otp, createdAt: new Date() }, { upsert: true });

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'User registered. OTP sent to email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

// User profile update after login (optional future auth middleware)
router.put('/profile', updateUserProfile);
// router.put('/profile', auth, updateUserProfile); // Use when auth is added

module.exports = router;
