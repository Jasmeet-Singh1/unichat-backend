// models/forum.js
const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the base User collection, not discriminators
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxLength: 2000
    },
    image: {
        type: String,
        default: ''
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user' // Reference the base User collection
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add indexes for better performance
forumSchema.index({ createdAt: -1 });
forumSchema.index({ author: 1 });

module.exports = mongoose.model('Forum', forumSchema);