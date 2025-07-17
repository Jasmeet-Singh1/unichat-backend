// models/forum.js
const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],

  isPinned: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('forum', forumSchema);
