const express = require('express');
const router = express.Router();
const Otp = require('../models/OTP');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Route for User Login
router.post('/login', Login);


// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });
  if (!record || record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Delete the OTP after success
  await Otp.deleteMany({ email });

  // Mark as verified in memory or token (or temp collection if needed)
  res.status(200).json({ message: 'OTP verified. You can now complete registration.' });
});

//Complete User Information
router.post('/complete-profile', async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    bio,
    programType,
    program,
    coursesEnrolled,
    expectedGradDate,
    studentClubs,
  } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      bio,
      role: 'Student',
      programType,
      program,
      coursesEnrolled,
      expectedGradDate,
      studentClubs,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(201).json({ message: 'Registration complete', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Profile completion failed' });
  }
});

module.exports = router;

