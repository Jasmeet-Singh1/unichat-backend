const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  
    title: { type: String, required: true }, 
     
    body: { type: String, required: true },
  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        validate: {
            validator: async function (value) {
            const User = require('./user');
            const user = await User.findById(value);
            return user && user.role === 'admin';
            },
            message: 'Only an admin can create announcements'
        }
    },
    
    target: {
        role: [{ type: String, enum: ['Student', 'Mentor', 'Alumni'] }], // no 'admin'
        course: [{ type: String, ref: 'course' }],
        program: [{ type: String, ref: 'program' }]
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('announcement', announcementSchema);
