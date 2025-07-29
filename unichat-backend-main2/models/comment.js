// models/comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({

    forum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'forum',
        required: true
    },
  
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
  
    content: {
        type: String,
        required: true
    },
  
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
  
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
  timestamps: true
});

module.exports = mongoose.model('comment', commentSchema);


