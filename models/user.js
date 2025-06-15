const mongoose = require ('mongoose'); 
//import mongoose library

const options = { discriminatorKey: 'role', timestamps: true};
// discriminator key used when we want to create sub schema
// Timestamps automatically adds createdAt and updatedAt field. 

const userSchema = new mongoose.Schema({


    firstName: {type:String, required: true, trim: true},
    lastName:  {type:String, trim: true},
    
    role: {
        type:String , 
        enum: ["Student","Mentor","Alumni", "Admin"], 
        required: true
    },
    

    username: {
                type:String, required: true, unique: true,
                minlength: 5, 
                trim: true, 
                validate: {
                    validator: function (v){
                    return /^[a-zA-Z0-9]+[_.]?[a-zA-Z0-9]+$/.test(v);
                },
                message: "Username must be at least 5 characters... "
                }
    },
   
    email: {
        type:String, 
        required: true, unique: true,
        lowercase: true, trim: true,  
        validate: {
            validator: function (email){
                    if (this.role === "Student" || this.role === "Mentor")
                        {
                            return /@student\.kpu\.ca$/.test(email);
                            // this will ensure the email ends with @student.kpu.ca
                    }

                return /.+@.+\..+/.test(email);

          },
            message: (props) => `${props.value} is not a valid email address. `
        }     
    },
   
    password: {
        type:String, 
        required: true,
        minlength: 7,
        validate:{
            validator: function (v) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{7,}$/.test(v);
            },
            message: "Password must contain at least 1 lowercase, 1 uppercase, 1 number, 1 special character (!@#$%^&*), and be more than 7 characters",
        }
    },
                
    
    bio: {type: String, default: ""},
   
    interests: {type: [String], default: []}

}, options);

userSchema.virtual('fullName').get(function (){
    return `${this.firstName} ${this.lastName}`;

});

module.exports = mongoose.model('User', userSchema);


