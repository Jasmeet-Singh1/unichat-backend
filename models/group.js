const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  
    name: {
        type: String,
        required: true,
    },
  
    description: String,
  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
  
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  
     isPrivate: {
        type: Boolean,
        default: true, // groups are private by design
     },
  
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Group', groupSchema);
