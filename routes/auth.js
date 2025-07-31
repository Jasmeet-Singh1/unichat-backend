const express = require('express');
const router = express.Router();
const Otp = require('../models/OTP');
const User = require('../models/user');
const Student = require('../models/student');
const Mentor = require('../models/mentor');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const notifyCoursePeersOnNewSignup = require('../controllers/notificationController');

//Verify OTP
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

// Complete profile for students.
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

    console.log('coursesEnrolled', expectedGradDate);
    //Notify peers in same course details.
    await notifyCoursePeersOnNewSignup(user);
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

//complete profile for mentors (DRAFT) DO NOT UNCOMMENT THIS PART UNTIL ADN UNLESS TESTED - Harleen

//Changed few things and Tested by Jasmeet✅
router.post('/complete-mentor-profile', async (req, res) => {
  try {
    const {
      email,
      bio,
      programType,
      program,
      coursesEnrolled,
      proof,
      courseExpertise,
      availability,
      expectedGradDate,
      overallGPA,
      showGPA,
    } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'User not found or not verified' });
    }

    const mentor = await Mentor.findById(user._id);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor profile not found.' });
    }
    mentor.bio = bio;
    mentor.programType = programType;
    mentor.program = program;
    mentor.coursesEnrolled = coursesEnrolled;
    mentor.expectedGradDate = expectedGradDate || null;
    mentor.courseExpertise = courseExpertise || [];
    mentor.availability = availability || [];
    mentor.proof = proof;
    mentor.overallGPA = overallGPA || null;
    mentor.showGPA = showGPA ?? false;

    mentor.isPendingApproval = true;
    mentor.isApproved = false;

    await mentor.save();
    res.status(200).json({ message: 'Mentor profile completed and pending approval.' });
  } catch (err) {
    console.error('MENTOR PROFILE ERROR:', err);
    res.status(500).json({
      message: 'Failed to complete mentor profile.',
      error: err.message,
    });
  }
});

module.exports = router;
