const mongoose = require('mongoose');
const User = require('./user');

const mentorSchema = new mongoose.Schema(
  {
    expectedGradDate: {
      type: Date,
    },

    courseExpertise: {
      type: [
        {
          course: {
            type: String, // course _id (course code)
            ref: 'course',
            required: true,
          },
          topicsCovered: { type: [String], default: [] },
          instructor: { type: String },
          grade: {
            type: String,
            required: true,
            enum: ['A+', 'A', 'A-', 'B+'],
          },
        },
      ],
      /*validate: {
      validator: function(val) {
        return val.length > 0;
      },
      message: 'At least one course expertise with a good grade is required'
    }*/
    },

    availability: {
      type: [
        {
          day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true,
          },
          from: {
            type: String,
            // hour: { type: Number, min: 1, max: 12, required: true },
            // minute: { type: Number, min: 0, max: 59, required: true },
            // ampm: { type: String, enum: ['AM', 'PM'], required: true },
          },
          to: {
            type: String,
            // hour: { type: Number, min: 1, max: 12, required: true },
            // minute: { type: Number, min: 0, max: 59, required: true },
            // ampm: { type: String, enum: ['AM', 'PM'], required: true },
          },
        },
      ],
      default: [],
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isPendingApproval: {
      type: Boolean,
      default: true,
    },

    proof: {
      // type: [String]
      /*required: true,
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "At least one supporting file is required for mentor."
    }*/
    },

    overallGPA: {
      type: Number,
    },

    showGPA: {
      type: Boolean,
      default: false,
    },

    /* updateGpaReq: {
    requested: { type: Boolean, default: false },
    submittedAt: { type: Date },
    message: { type: String },
    proofFiles: {
      type: [String],
      validate: {
        validator: function (v) {
          if (!v) return true; // validate only if provided
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one supporting file is required."
      }
    }
  }*/
  },
  { timestamps: true }
);

const Mentor = User.discriminator('Mentor', mentorSchema);
module.exports = Mentor;
