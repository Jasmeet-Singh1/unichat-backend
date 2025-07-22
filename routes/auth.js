const express = require('express');
const router = express.Router();
const Otp = require('../models/OTP');
const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Step 2: Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const record = await Otp.findOne({ email });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();
    await Otp.deleteMany({ email });

    res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'OTP verification failed' });
  }
});

// Step 3: Complete profile
router.post('/complete-profile', async (req, res) => {
  const { email, bio, programType, program, coursesEnrolled, expectedGradDate, studentClubs } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'User not found or not verified' });
    }

    // Update base user fields
    user.bio = bio;
    user.programType = programType;
    user.program = program;
    user.coursesEnrolled = coursesEnrolled;
    await user.save();

    // Handle discriminator fields
    if (user.role === 'Student') {
      await Student.findOneAndUpdate(
        { _id: user._id },
        {
          expectedGradDate,
          studentClubs,
        },
        { upsert: true }
      );
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(200).json({ message: 'Profile completed', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Profile completion failed' });
  }
});

module.exports = router;
