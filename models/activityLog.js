const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  
  action: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('activityLog', activityLogSchema);