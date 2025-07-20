const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({

    reporter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', required: true 
        },

    reportType: {
        type: String,
        enum: ['forum', 'directMessage', 'groupMessage', 'comment', 'profile'],
        required: true
    },

    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
  
    reason: {
        type: String,
        enum: ['harassment', 'spam', 'nudity', 'hate speech', 'other'],
        required: true
    },

    description: String,

    createdAt: { 
        type: Date, 
        default: Date.now 
    },

    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    }
});

module.exports = mongoose.model('report', reportSchema);
