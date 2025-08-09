// routes/adminAuth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const auth = require('../middleware/auth'); // Your existing middleware

// Import mongoose for database queries
const mongoose = require('mongoose');

// @route   POST /api/adminauth/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Admin login attempt:', { email, password: '***' });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin in database using the admins collection
    const adminsCollection = mongoose.connection.db.collection('admins');
    const admin = await adminsCollection.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Found admin:', { email: admin.email, role: admin.role });

    // Check password against stored hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: admin._id,
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        role: 'admin'
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }, // Admin tokens expire in 24 hours
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          throw err;
        }
        
        console.log('Admin login successful:', email);
        res.json({
          success: true,
          token,
          user: {
            id: admin._id,
            email: admin.email,
            name: `${admin.firstName} ${admin.lastName}`,
            role: admin.role
          }
        });
      }
    );

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/adminauth/verify
// @desc    Verify admin token and get admin data
// @access  Private (Admin only)
router.get('/verify', auth, (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/adminauth/logout
// @desc    Admin logout (client-side token removal)
// @access  Private (Admin only)
router.post('/logout', auth, (req, res) => {
  try {
    // Since JWT is stateless, we just send success
    // Client should remove token from localStorage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to hash password (for creating new admin users)
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    console.log('Create admin request:', { email, name });
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin record in database
    const adminsCollection = mongoose.connection.db.collection('admins');
    
    // Check if admin already exists
    const existingAdmin = await adminsCollection.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Insert new admin
    const newAdmin = {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ')[1] || '',
      role: 'Super Admin',
      username: email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await adminsCollection.insertOne(newAdmin);

    console.log('New admin created:', {
      email: newAdmin.email,
      name: newAdmin.firstName + ' ' + newAdmin.lastName,
      role: newAdmin.role
    });

    res.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: result.insertedId,
        email: newAdmin.email,
        name: newAdmin.firstName + ' ' + newAdmin.lastName,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;