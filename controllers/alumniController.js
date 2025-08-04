const User = require('../models/user'); // Base User model

// Get all alumni users
exports.getAllAlumni = async (req, res) => {
  try {
    const alumniUsers = await User.find({ role: 'Alumni' }); // Role filter
    res.status(200).json(alumniUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni', error: error.message });
  }
};

// Get a specific alumni by ID (only if role is 'alumni')
exports.getAlumniById = async (req, res) => {
  try {
    const alumni = await User.findOne({ _id: req.params.id, role: 'Alumni' });
    if (!alumni) {
      return res.status(404).json({ message: 'Alumni not found' });
    }
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alumni profile', error: error.message });
  }
};
