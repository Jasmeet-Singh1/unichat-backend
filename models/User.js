const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    username: { type: String, default: null },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true, // hashed using bcrypt
    },

    bio: { type: String, default: null },
    role: { type: String, enum: ['Mentor', 'Student'], default: null },
    programType: { type: String, default: null },
    program: { type: String, default: null },
    coursesEnrolled: { type: [String], default: [] },
    expectedGradDate: { type: Date, default: null },
    studentClubs: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
