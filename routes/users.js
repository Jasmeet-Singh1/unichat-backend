const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Student = require('../models/student');
const Mentor = require('../models/mentor');
const Alumni = require('../models/alumni');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Otp = require('../models/OTP');
const sendOtpEmail = require('../utils/sendOtpEmail');

// POST register route - handles ALL roles (Student, Mentor, Alumni)
router.post('/register', async (req, res) => {
  const { 
    firstName, 
    lastName, 
    role, 
    username, 
    email, 
    password
  } = req.body;

  try {
    console.log('📧 Registration attempt for email:', email, 'Role:', role);

    // Email validation based on role
    if ((role === 'Mentor' || role === 'Student') && !/^[^\s@]+@student\.kpu\.ca$/i.test(email)) {
      return res.status(400).json({
        message: role === 'Mentor' ? 'Mentor email must end with @student.kpu.ca' : 'Only KPU emails are allowed.',
      });
    }

    // Check if user already exists across all role models
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email or Username already exists. Please login.' });
    }

    // Generate and save OTP first
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() }, 
      { otp, createdAt: new Date() }, 
      { upsert: true }
    );

    console.log('🛂 OTP generated:', otp);
    console.log('📮 Attempting to send OTP email to:', email);

    // Send OTP email
    try {
      const emailResult = await sendOtpEmail(email.toLowerCase(), otp);
      console.log('📧 Email sending result:', emailResult);
      console.log('✅ OTP email sent successfully!');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('Full email error:', emailError);
      
      // Clean up OTP if email fails
      await Otp.deleteOne({ email: email.toLowerCase() });
      
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again.',
        emailError: emailError.message 
      });
    }

    // Store user data temporarily in session/cache or send it back to frontend
    // For now, we'll expect the frontend to send all data again during OTP verification
    
    res.status(200).json({ 
      message: 'OTP sent to email. Please verify to complete registration.',
      email: email.toLowerCase(),
      role: role
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({
      message: 'Failed to register user',
      error: err.message || err.toString(),
    });
  }
});

// OTP verification only (doesn't create user)
router.post('/verify-otp-only', async (req, res) => {
  const { email, otp } = req.body;

  try {
    console.log('🔍 OTP verification only for:', email, 'with OTP:', otp);

    const otpDoc = await Otp.findOne({ email: email.toLowerCase() });
    
    if (!otpDoc) {
      console.log('❌ No OTP found for email:', email);
      return res.status(400).json({ message: 'OTP not found or expired.' });
    }

    console.log('📋 Found OTP in DB:', otpDoc.otp);
    
    if (otpDoc.otp !== otp) {
      console.log('❌ OTP mismatch. Expected:', otpDoc.otp, 'Received:', otp);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Check if OTP is expired (10 minutes)
    const otpAge = new Date() - otpDoc.createdAt;
    if (otpAge > 10 * 60 * 1000) {
      console.log('❌ OTP expired. Age:', otpAge, 'ms');
      await Otp.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Mark OTP as verified but don't delete it yet
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() }, 
      { verified: true }
    );

    console.log('✅ OTP verified successfully for:', email);

    res.status(200).json({ 
      message: 'OTP verified successfully. Continue with registration.',
      email: email.toLowerCase()
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

router.post('/create-user', async (req, res) => {
  const { 
    email,
    firstName, 
    lastName, 
    role, 
    username, 
    password,
    bio,
    program,
    programType,
    coursesEnrolled,
    expectedGradDate,
    courseExpertise,
    availability,
    proof,
    overallGPA,
    gradDate,
    currentJob,
    studentClubs
  } = req.body;

  try {
    console.log('🏗️ Creating', role, 'account for:', email);
    
    // Check if OTP was verified (same for all roles)
    const otpDoc = await Otp.findOne({ 
      email: email.toLowerCase(), 
      verified: true 
    });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Email not verified. Please verify OTP first.' });
    }

    // Role-specific validation
    if (role === 'Mentor') {
      if (!courseExpertise || courseExpertise.length === 0) {
        return res.status(400).json({ message: 'Course expertise is required for mentors.' });
      }
      
      for (let expertise of courseExpertise) {
        if (!expertise.course || !expertise.grade) {
          return res.status(400).json({ 
            message: 'Each course expertise must have a course and grade.' 
          });
        }
      }
    }

    // Handle proof field (same logic as before)
    let processedProof = [];
    if (proof && Array.isArray(proof)) {
      processedProof = proof.filter(item => 
        item && typeof item === 'string' && item.trim() !== '' && item !== '{}'
      );
    }
    if (processedProof.length === 0 && role !== 'Student') {
      processedProof = ['pending-file-upload'];
    }

    let newUser;

    // Create user based on role
    if (role === 'Student') {
      newUser = new Student({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password,
        role,
        bio,
        program,
        programType,
        coursesEnrolled,
        expectedGradDate,
        studentClubs,
        isVerified: true,
      });
    } else if (role === 'Mentor') {
      newUser = new Mentor({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password,
        role,
        bio,
        program,
        programType,
        coursesEnrolled,
        expectedGradDate,
        courseExpertise,
        availability,
        proof: processedProof,
        overallGPA,
        isVerified: true,
        isPendingApproval: true,
        isApproved: false,
      });
    } else if (role === 'Alumni') {
      newUser = new Alumni({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password,
        role,
        bio,
        program,
        programType,
        coursesEnrolled,
        gradDate,
        currentJob,
        proof: processedProof,
        isVerified: true,
        isApproved: false,
      });
    } else {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }

    await newUser.save();
    console.log('✅ User created successfully:', newUser.email, 'Role:', newUser.role);

    // Clean up OTP
    await Otp.deleteOne({ email: email.toLowerCase() });
    console.log('🗑️ OTP deleted from database');

    // Role-specific response
    let message;
    if (role === 'Student') {
      message = 'Student registration successful. You can now login.';
    } else if (role === 'Mentor') {
      message = 'Mentor registration successful. Please wait for admin approval.';
    } else {
      message = 'Alumni registration successful. Please wait for admin approval.';
    }

    res.status(201).json({ 
      message,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved !== undefined ? newUser.isApproved : true
      }
    });

  } catch (err) {
    console.error('Account creation error:', err);
    res.status(500).json({ 
      message: 'Account creation failed', 
      error: err.message,
      details: err.errors ? Object.keys(err.errors) : 'Unknown error'
    });
  }
});

// Login route (unchanged)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Try finding the user across all role collections
    let user = 
      (await Student.findOne({ email: email.toLowerCase() })) ||
      (await Mentor.findOne({ email: email.toLowerCase() })) ||
      (await Alumni.findOne({ email: email.toLowerCase() }));

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

    if ((user.role === 'Mentor' || user.role === 'Alumni') && user.isApproved === false) {
      return res.status(403).json({
        message: 'Your account is awaiting admin approval.',
      });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
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