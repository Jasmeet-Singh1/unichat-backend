const mongoose = require ('mongoose'); 
const programSchema = new mongoose.Schema ({
    
    type: {
        type: String, 
        enum: ['Certificate', 'Diploma', 'Degree', 'Post Baccalaureate Diploma','Graduate Certificate', 'Associate Degree','Continuing and Professional Studies' ,'Other']
    },

    name: {
        type: String,
        required: true, 
        unique: true
    },

    faculty: {
        type: String,
        enum: ['Faculty of Academic & Career Preparation','Faculty of Arts', 'Faculty of Health','Faculty of Trades and Technology','Melville School of Business','Wilson School of Design','Continuing and Professional Studies' ]
    },

    courses:[
        {
            type: String, 
            ref: 'course',
            required: true
        }
    ]


});
module.exports = mongoose.model('program', programSchema);