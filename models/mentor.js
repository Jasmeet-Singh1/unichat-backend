const mongoose = require('mongoose');
const User = require('./user');

const mentorSchema = new mongoose.Schema ({
    
        programType: {
        type:String, 
        enum:['Certificate', 'Diploma', 'Bachelor', 'Other'], 
        validate: {
            validator: function (v)
            {
                if (v&&!this.program){
                    return false; 
                }   
                return true;
            },
            message: "Please specify program to set program type."
        }
    },

    program: {
        type: String,
        validate:{
            validator: function(v){
                if (v && !this.programType){
                    return false;
                }
                return true;
            },
            message: "Please enter the program name if you choose a program type."
        }
    },
    
    courseExpertise: [{
        courseCode: {type: String, trim: true, required: true},
        courseName: {type: String, required: true},
        topicsCovered: {type: [String], default: []},
        instructor: {type: String},
        grade: {
            type: String, 
            enum: ['A+','A','A-','B+'],
        }
    }],

    mentorshipAreas: {
        type: [{
            courseCode: {type: String, trim: true, required: true},
            courseName: {type: String, required: true},
            topicsCovered: {type: [String], default: []},
            instructor: {type: String},
            proficiency: {
                type: String,
                enum: [
                    'Basic Understanding', 
                    'Assignment/ Project - Level Help',
                    'Conceptual Mastery',
                    'Expert'
                ],
            }
        }],
        default: []
    },

    availability: {

        type: [{
            day: {
                type: String, 
                enum:['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                required: true
            },

            from: {
                hour: {type: Number, min: 1, max: 12, required: true},
                minute: {type: Number, min: 0, max: 59, required: true },
                ampm: {type: String, enum: ['AM', 'PM'], required: true }
            },

            to: {
                hour: {type: Number, min: 1, max: 12, required: true},
                minute: {type: Number, min: 0, max: 59, required: true },
                ampm: {type: String, enum: ['AM', 'PM'], required: true }
            }
        }],
        
        default: []
    },

    isApproved: {
        type: Boolean,
        default: false
    },

    proof: {
        type: [String],
        required: true,
        validate: {
            validator: function (v){
               return Array.isArray(v) && v.length > 0 ; 
               /*check if its an array because even if user enters a single 
               value, it will create a string and that might create errors in furture.
               */
            },
            message: "At least one supporting file is required for mentor."
        }
    },

    overallGPA: {
        type: Number, 
        required: true
    }, //Admin will be responsible for entering gpa 

    showGPA: {
        type: Boolean, 
        default: false
    },

    updateGpaReq: {
        requested: {type: Boolean},
        submittedAt: { type: Date },
        message: { type: String },
        proofFiles: {
            type: [String],
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length > 0;
                },
            message: "At least one supporting file is required."
            }
        },  
    }

});

const Mentor = User.discriminator('Mentor', mentorSchema);
module.exports = Mentor;

