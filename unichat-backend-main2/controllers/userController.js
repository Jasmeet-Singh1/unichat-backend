// controllers/userController.js

const User = require('../models/user');

// @desc    Update profile (student or mentor)
// @route   PUT /api/users/profile
// @access  Private

const updateUserProfile = async (req, res) => {
  try {
    // TEMP: Find user by email passed in request body, since we don't have authentication yet
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required to identify user' });
    }

    const updates = { ...req.body };

    // Prevent email updates
    if ('email' in updates) {
      return res.status(400).json({ msg: 'Email cannot be updated.' });
    }

    // Find user by email (instead of userId)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Fields user is allowed to edit
    const allowedFields = [
      'firstName',
      'lastName',
      'bio',
      'programType',
      'program',
      'coursesEnrolled'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.status(200).json({
      msg: 'Profile updated successfully.',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        programType: user.programType,
        program: user.program,
        coursesEnrolled: user.coursesEnrolled,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Server error.' });
  }
};

module.exports = { updateUserProfile };
//UNCOMMENT THIS ONE ONCE AUTHENTICATION IS DONE
/*const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = { ...req.body };

    // Prevent email updates
    if ('email' in updates) {
      return res.status(400).json({ msg: 'Email cannot be updated.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Fields user is allowed to edit
    const allowedFields = [
      'firstName',
      'lastName',
      'bio',
      'programType',
      'program',
      'coursesEnrolled'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.status(200).json({
      msg: 'Profile updated successfully.',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        programType: user.programType,
        program: user.program,
        coursesEnrolled: user.coursesEnrolled,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Server error.' });
  }
};

module.exports = { updateUserProfile };*/


