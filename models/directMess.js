const mongoose = require('mongoose');
const directMessageSchema = new mongoose.Schema({

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    message: String,
    
    timestamp: { type: Date, default: Date.now },

    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
         readAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    isRead: {
        type: Boolean,
        default: false
    },
    
    like: [{    
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
    }]

});

module.exports = mongoose.model('directMessage', directMessageSchema);
