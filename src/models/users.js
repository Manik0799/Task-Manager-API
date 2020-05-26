const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt= require("jsonwebtoken")
const Task= require("./tasks")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalide email")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error("Cannot contain password string in it")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age cannot be negative")
            }
        }
    },
    tokens : [
        {
            token : {
                type : String,
                required : true
            }
        }
    ],
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})


// establishing the relationship b/w the user and the tasks he has created
// Not stored on the db, Hence it is virtual
userSchema.virtual("userTasks", {
    ref : "Task",
    localField : "_id",
    foreignField : "owner"
})

// Hiding private data such as the password and the web tokens
userSchema.methods.toJSON= function(){
    const user= this
    const userObject= user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Auth token
userSchema.methods.generateAuthToken= async function(){
    const user = this
    const token= jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens= user.tokens.concat({token : token})
    await user.save()
    
    return token
}

// Checking the login credentials
// By defining function like this we can directly acess it in our routes
userSchema.statics.findByCredentials= async (email, password) => {
    const user= await User.findOne({ email : email })

    if(!user){
        throw new Error("Unable to Login !")
    }

    const isMatch= await bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error("Unable to Login !")
    }

    return user
}

// Setting up Middleware for hashing passwords before saving
userSchema.pre("save", async function (next) {
    const user = this

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    // To ensure running of 'save' event after the above code
    next()
})

// Setting up middleware
// Delete user tasks when user has been removed
userSchema.pre("remove", async function(next) {
    const user= this

    await Task.deleteMany({owner : user._id})

    next()
})

const User = mongoose.model("User", userSchema)


module.exports = User