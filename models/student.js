const mongoose = require('mongoose');

//Import the common fields from User Collection 
const User = require('./user');

const studentSchema = new mongoose.Schema({

    expectedGradDate: {type: Date, required: true},

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

    coursesEnrolled: {
        type: [String],
        default: []
    },

    studentClubs: {
        type: [String],
        enum: [
            'ASK Club',
            'Bible Study @ Kwantlen',
            'K-Drama Club',
            'Health Science Club',
            'KHRA',
            'KPU Cricket Club',
            'KSA Anime Club',
            'KPU Anthropology Society',
            'KPU Bhangra Club',
            'KPU Music Club',
            'KPU MUN',
            'KPU OTM Club',
            'KPU Pinoy Student Club',
            'KPU Pre-Med Club',
            'KPU Pride Society',
            'Kwantlen Art Collective',
            'Kwantlen Nepalese Student Association',
            'Kwantlen Psychology Society',
            'Kwantlen Gaming Guild',
            'Kwantlen Geographers',
            'Kwantlen IT Club',
            'Kwantlen Sikh Student Association (KSSA)',
            'Muslim Student Association',
            'School Outreach Ministry (SCOM)',
            'The Japan Club',
            'The Kwantlen Creative Writing Guild',
            'The Kwantlen Pageturners',
            'Kwantlen Debate Club',
            'Kwantlen Polytechnic University Marketing Association (KPUMA)',
            'Sustainable Agriculture Student Association',
            'SOCA Club (KPU\'s African & Caribbean Students Association)',
            'Stem Roots Club',
            'Student Entrepreneurs Club',
            'Kwantlen Malayali Club (KMC)',
            'HSA',
            'Barkat',
            'KPU Sustainability Club',
            'KPU Dance Club'
        ],
        default: []
    }

});

//Student as in base schema
const Student = User.discriminator('Student', studentSchema);

module.exports = Student;

