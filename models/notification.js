const mongoose = require('mongoose');

// This is for in app notifications 

const notificationSchema = new mongoose.Schema ({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String ,
        enum: [ 'message', 'new user',
            'admin announcement', 'liked forum', 'request',
            'added to group'
        ],
        required: true
    },

    message: {
        type: String, 
        required: true
    },

    //dynamic ref system in mongo where related id stores the ref id
    // and ref path , stores which model to use
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel' //dynamic reference
    },

    seen: {
        type: Boolean, 
        default: false
    }
}, {timestamps: true

});

module.exports = mongoose.model('notification', notificationSchema);
