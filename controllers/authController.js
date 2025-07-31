// Import required modules and models
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Base User model for checking uniqueness
const Student = require('../models/student'); // Role-specific models
const Mentor = require('../models/mentor');
const Alumni = require('../models/alumni');
const notifyCoursePeersOnNewSignup = require('./notificationController');
const jwt = require('jsonwebtoken');
const sendOtpEmail = require('../utils/sendOtpEmail');
const Otp = require('../models/OTP');

// User Registration Controller (Sign Up)
const SignUp = async (req, res) => {
  try {
    // Destructure all expected fields from the request body
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      bio,
      program,
      programType,
      coursesEnrolled,

      // Role-specific fields
      expectedGradDate,
      studentClubs,
      courseExpertise,
      availability,
      proof,
      overallGPA,
      gradDate,
      currentJob,
    } = req.body;

    // Check if email or username already exists in the base User collection
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or Username already exists.' });
    }

    //Validate email requirements.
    if (role === 'Mentor' && !email.toLowerCase().endsWith('@student.kpu.ca')) {
      return res.status(400).json({ error: 'Mentor Email must end with @student.kpu.ca' });
    }

    // DO NOT hash here — just pass the plain password and rely on Mongoose pre-save hook to hash
    const hashedPassword = password; // assign password directly

    let newUser; // Placeholder for the user object based on role

    // Create a new Mentor user (requires approval)
    if (role === 'Mentor') {
      newUser = new Mentor({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        bio,
        program,
        programType,
        coursesEnrolled,
        expectedGradDate,
        courseExpertise,
        availability,
        proof,
        overallGPA,
        isPendingApproval: true,
        isApproved: false,
      });
    }

    // Create a new Alumni user (requires approval)
    else if (role === 'Alumni') {
      newUser = new Alumni({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        bio,
        program,
        programType,
        coursesEnrolled,
        gradDate,
        currentJob,
        proof,
        isApproved: false,
      });
    }

    // If role is invalid, return an error
    else {
      return res.status(400).json({ error: 'Invalid role provided.' });
    }

    // Save the user to the database (Mongoose pre-save hook will hash password here)
    await newUser.save();

    // Return success message
    res.status(201).json({
      message: 'User registered successfully. If you are a mentor or alumni, please wait for admin approval.',
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// User Login Controller
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try finding the user across all three role collections
    let user =
      (await Student.findOne({ email: email.toLowerCase() })) ||
      (await Mentor.findOne({ email: email.toLowerCase() })) ||
      (await Alumni.findOne({ email: email.toLowerCase() }));

    console.log('Login attempt for email:', email);
    console.log('User found:', user ? user.username : 'No user found');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if ((user.role === 'Mentor' || user.role === 'Alumni') && !user.isApproved) {
      return res.status(403).json({ error: 'Account not approved yet by admin.' });
    }

    //create token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: `${user.firstName} ${user.lastName}`,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to server error.' });
  }
};

module.exports = { SignUp, Login };
