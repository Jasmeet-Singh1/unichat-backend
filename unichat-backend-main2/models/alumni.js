const mongoose = require('mongoose');
const User = require('./user');

const alumniSchema =  new mongoose.Schema({

    gradDate: { 
        type: Date, required: true,
        validate: {
            validator: function (v){
                return v <= new Date();
                //This ensures the date is today or before today
            }
        }
    },

    currentJob: {
        type: {
            companyName: {type:String, default:''},
            jobTitle: { type: String, default: '' },
            startDate: { type: Date },
            isPresent: { type: Boolean}
        },

        validate:{
            validator: function (v){
                // so if there is no input by the user for any of the job fields , validator will not fail, so its return true
                if (!v) return true; 

                //Destructuring and anyFilled checks if any of these fields are filled or not
                const {companyName, jobTitle, startDate, endDate, isPresent}=v;
                const leastOneFilled = companyName || jobTitle || startDate || endDate || isPresent; 

                //if any of the fields are not filled, just pass the validation 
                if (!leastOneFilled) return true;

                //if any info is there, they shoudl not be there or empty spaces are filled , return false\
                if (!companyName || companyName.trim() === "" || 
                    !jobTitle || jobTitle.trim()==="" || !startDate) {return false;}

                // Both present date and end date cannot be missing
                if (!isPresent && !endDate){return false; } 
                
                
                return true; 
            },
        message: "Please provide all mentioned job details if filling any job information "
        }
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
            message: "At least one supporting file/ completion letter is required for alumni."
        }
    }

}, { timestamps: true });

const Alumni = User.discriminator('Alumni', alumniSchema);
module.exports = Alumni;