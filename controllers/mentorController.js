const User = require("../models/user");

exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: "Mentor" });
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMentorByIdentifier = async (req, res) => {
  try {
    const { email, username } = req.query;

    let query = {};
    if (email) query.email = email;
    else if (username) query.name = username; // Assuming `name` is the username field

    if (!email && !username) {
      return res.status(400).json({ message: "Please provide email or username" });
    }

    const mentor = await User.findOne({ ...query, role: "Mentor" });
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json(mentor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
