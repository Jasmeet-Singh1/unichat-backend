const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema ({

    title: { 
        type: String, 
        required: true 
    },
  
    description: String,

    date: Date,
    location: String,
    imageUrl: String,
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },

    maxParticipants: {
        type: Number,
        default: 30 
    },

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
});

module.exports = mongoose.model('Event', eventSchema);