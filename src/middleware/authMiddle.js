const jwt= require("jsonwebtoken")
const User= require("../models/users")

// Setting up the auth middleware
// "next" helps us to go to the route handler after authentication 
const auth= async (req, res, next) => {

    try{
        const token= req.header("Authorization").replace("Bearer ", "")
        const decoded= jwt.verify(token, process.env.JWT_SECRET)
        const user= await User.findOne({_id : decoded._id, "tokens.token" : token})

        if(!user){
            throw new Error()
        }

        req.token= token
        req.user= user
        next()
    } catch(e){
        res.status(401).send("Error : Please Authenticate !")
    }
    

    
}


module.exports= auth