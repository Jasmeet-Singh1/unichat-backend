const mongoose = require('mongoose');
const groupMessageSchema = new mongoose.Schema({

    groupId: String,
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    
    message: String,
    
    timestamp: { type: Date, default: Date.now },

    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
        }],

    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        
        readAt: {
            type: Date,
            default: Date.now
            }
    }]

});

module.exports = mongoose.model('groupMessage', groupMessageSchema);