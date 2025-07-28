const User = require('../models/user');

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const updates = { ...req.body };

    // Prevent email or role updates
    if ('email' in updates || 'role' in updates) {
      return res.status(400).json({ msg: 'Email or role cannot be updated.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    // Fields allowed to update for everyone
    const allowedFields = ['firstName', 'lastName', 'bio', 'programType', 'program', 'coursesEnrolled'];

    // Add role specific fields
    if (user.role === 'Student') {
      allowedFields.push('studentClubs', 'expectedGradDate');
    } else if (user.role === 'Mentor') {
      allowedFields.push('courseExpertise', 'availability', 'expectedGradDate', 'proof', 'overallGPA', 'showGPA');
    }

    // Apply updates only on allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
        if (['studentClubs', 'courseExpertise', 'availability', 'proof'].includes(field)) {
          user.markModified(field);
        }
      }
    });

    await user.save();

    // Remove password from response
    const { password, ...safeUser } = user.toObject();

    res.status(200).json({ msg: 'Profile updated successfully.', user: safeUser });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Server error.' });
  }
};

module.exports = updateUserProfile;
