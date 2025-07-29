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

    like: [{    
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
    }]

});

module.exports = mongoose.model('directMessage', directMessageSchema);
