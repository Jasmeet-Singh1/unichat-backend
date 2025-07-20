const mongoose = require ('mongoose');
const courseSchema = new mongoose.Schema ({

    _id: {
        type: String, 
        required: true,
        uppercase: true
    },

    name: {
        type:String, 
        required: true, 
        unique:true
    },
    
    //instructor requirement
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user'
    }]

});
module.exports = mongoose.model('course', courseSchema);
