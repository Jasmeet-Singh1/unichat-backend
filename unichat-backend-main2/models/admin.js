const mongoose = require("mongoose");
const hashPass = require ("../utils/hashPass");


const adminSchema = new mongoose.Schema({

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: {type:String, unique: true, lowercase: true},

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
        match: /.+@.+\..+/
    },    

    password: {
        type: String,
        required: true,
        minlength: 7,
            validate:{
                validator: function (v) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{7,}$/.test(v);
                },
                message: "Password must contain at least 1 lowercase, 1 uppercase, 1 number, 1 special character (!@#$%^&*), and be more than 7 characters",
            }
    },

    role: {
        type: String,
        enum: ["Admin", "Super Admin"],
    },

}, {timestamps: true});  

// create username and alt if username exists
adminSchema.pre("save", async function(){
    if (!this.username && this.firstName && this.lastName){
        const f = this.firstName.trim().toLowerCase();
        const l = this.lastName.trim().toLowerCase();
        let oldUsername = f.charAt(0) + "_"+ l;
        let username = oldUsername;
        let count = 0; 

        while(await this.model('Admin').exists({username})){
            count++;
            username = `${oldUsername}${count}`;
        }
    console.log ("generated username: ", oldUsername);
    this.username = username;
    }

    //if hash is new or pass is changed, then 
    if (this.isModified("password")){
        console.log("Hashing...");
        const hashed = await hashPass(this.password);
        console.log("Hashed Successfully : ",hashed);
        
        if (!hashed){
            throw new Error("Hashing Failed...");
        }

        this.password=hashed;
    }
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;