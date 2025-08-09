// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth'); // Your existing auth middleware
const mongoose = require('mongoose');

// Admin check middleware using the admins collection directly
const adminCheck = async (req, res, next) => {
  try {
    console.log('Admin check - req.user:', req.user);
    
    // Extract user data from nested structure
    const userData = req.user.user || req.user; // Handle both nested and flat structures
    
    // Check if the authenticated user exists in admins collection
    const adminsCollection = mongoose.connection.db.collection('admins');
    const admin = await adminsCollection.findOne({ 
      $or: [
        { _id: new mongoose.Types.ObjectId(userData.id) }, // Use userData.id
        { email: userData.email } // Use userData.email
      ]
    });
    
    if (!admin) {
      console.log('Admin not found in admins collection for:', userData.email);
      return res.status(403).json({ 
        error: 'Admin access required. User not found in admin records.' 
      });
    }
    
    console.log('Admin found:', { email: admin.email, role: admin.role });
    
    // Add admin info to request for use in controllers
    req.admin = admin;
    next();
    
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Error verifying admin privileges' });
  }
};

// Admin dashboard stats
router.get('/stats', auth, adminCheck, adminController.getDashboardStats);

// User management routes
router.get('/users', auth, adminCheck, adminController.getAllUsers);
router.get('/users/:userId', auth, adminCheck, adminController.getUserById);
router.delete('/users/:userId', auth, adminCheck, adminController.deleteUser);
router.patch('/users/:userId/status', auth, adminCheck, adminController.updateUserStatus);

module.exports = router;