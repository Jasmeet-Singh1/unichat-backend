// Import required modules and models
const bcrypt = require('bcrypt');
const User = require('../models/user');       // Base User model for checking uniqueness
const Student = require('../models/student'); // Role-specific models
const Mentor = require('../models/mentor');
const Alumni = require('../models/alumni');
const hashPass = require('../utils/hashPassword'); // Custom password hashing function


// User Registration Controller (Sign Up)
const SignUp = async (req, res) => {
  try {
    // Destructure all expected fields from the request body
    const {
      firstName, lastName,
      username, email, password,
      role, bio,
      program, programType,
      coursesEnrolled,

      // Role-specific fields
      expectedGradDate, studentClubs,
      courseExpertise, availability, proof, overallGPA,
      gradDate, currentJob
    } = req.body;

    // Check if email or username already exists in the base User collection
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or Username already exists.' });
    }

    // Hash the password before storing it
    const hashedPassword = await hashPass(password);

    let newUser; // Placeholder for the user object based on role

    // Create a new Student user
    if (role === 'Student') {
      newUser = new Student({
        firstName, lastName, username, email: email.toLowerCase(),
        password: hashedPassword, role, bio, program, programType,
        coursesEnrolled, expectedGradDate, studentClubs
      });
    }

    // Create a new Mentor user (requires approval)
    else if (role === 'Mentor') {
      newUser = new Mentor({
        firstName, lastName, username, email: email.toLowerCase(),
        password: hashedPassword, role, bio, program, programType,
        coursesEnrolled, expectedGradDate,
        courseExpertise, availability, proof, overallGPA,
        isPendingApproval: true,
        isApproved: false
      });
    }

    // Create a new Alumni user (requires approval)
    else if (role === 'Alumni') {
      newUser = new Alumni({
        firstName, lastName, username, email: email.toLowerCase(),
        password: hashedPassword, role, bio, program, programType,
        coursesEnrolled, gradDate, currentJob, proof,
        isApproved: false
      });
    }

    // If role is invalid, return an error
    else {
      return res.status(400).json({ error: 'Invalid role provided.' });
    }

    // Save the user to the database
    await newUser.save();

    // Return success message
    res.status(201).json({
      message: 'User registered successfully. If you are a mentor or alumni, please wait for admin approval.'
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
    let user = await Student.findOne({ email: email.toLowerCase() }) ||
               await Mentor.findOne({ email: email.toLowerCase() }) ||
               await Alumni.findOne({ email: email.toLowerCase() });

    // If no user is found, return error
    if (!user) {
      return res.status(401).json({ error: 'Invalid email.' });
    }

    // Compare provided password with hashed password from DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // If the user is a mentor or alumni and not yet approved, block login
    if ((user.role === 'Mentor' || user.role === 'Alumni') && !user.isApproved) {
      return res.status(403).json({ error: 'Account not approved yet by admin.' });
    }

    // Send success response with user info (You can also generate a JWT token here if needed)
    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to server error.' });
  }
};

// Export both controllers
module.exports = { SignUp, Login };
