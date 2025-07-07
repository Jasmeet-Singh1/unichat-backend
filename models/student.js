const mongoose = require('mongoose');

//Import the common fields from User Collection 
const User = require('./user');

const studentSchema = new mongoose.Schema({

    expectedGradDate: {type: Date, required: true},

    studentClubs: [{

        club:{
            type: String, 
            ref: 'club',
            required: true,
            index:true
        },
        
        designation: {
            type:String,
            enum: [
                'Member',
                'Lead',
                'Volunteer',
                'Secretary',
                'President',
                'Vice President'
            ],
            required: true
        }

    }]

});

//Student as in base schema
const Student = User.discriminator('Student', studentSchema);

module.exports = Student;

