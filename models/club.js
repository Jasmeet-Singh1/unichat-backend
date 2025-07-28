const mongoose = require('mongoose');

const studentClubSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.models.studentClub || mongoose.model('studentClub', studentClubSchema);
