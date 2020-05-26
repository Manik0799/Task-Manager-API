const express = require("express")
const router = new express.Router()
const authMiddleware = require("../middleware/authMiddle")
const multer= require("multer")
const sharp= require("sharp")
const User = require("../models/users")
const { sendWelcomeMail, sendCancelMail }= require("../emails/account")

// For creating a user
router.post("/users", async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()

        // Sending an email to the user who created the account
        sendWelcomeMail(user.email, user.name)

        // generating a token
        // This async function has been defined in the user Model
        const token = await user.generateAuthToken()
        res.send({ user: user, token: token })

    } catch (err) {
        res.status(500).send(err)
    }
})

// For logging in a user
router.post("/users/login", async (req, res) => {
    try {
        // This async function has been defined in the user Model
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user: user, token: token })
    } catch (err) {
        res.status(400).send()
    }
})

// For logging out a user
router.post("/users/logout", authMiddleware, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send("User Logged Out !")

    } catch (e) {
        res.status(500).send("Unable to logout !")
    }
})

// For logging out of all sessions
router.post("/users/logoutAll", authMiddleware, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()
        res.send("Logged out of all sessions")
    } catch (e) {
        res.status(500).send()
    }
})

// For fetching user profile details
router.get("/user/me", authMiddleware, async (req, res) => {

    res.send(req.user)
})

// For updating a user
router.patch("/users/me", authMiddleware , async (req, res) => {
    // To check the valid props which a user can update
    const updatesToDo = Object.keys(req.body)
    const allowedUpdates = ["name", "age", "email", "password"]
    const isValidOperation = updatesToDo.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid Updation !" })
    }

    try {
        const user = req.user
        updatesToDo.forEach((update) => {
            user[update] = req.body[update]
        })
        await user.save()

        // Code before executing a Middleware because Updates bypass middlewares
        // const user= await User.findByIdAndUpdate( req.params.id, req.body, {new : true, runValidators : true})

        res.status(200).send(user)

    } catch (err) {
        res.status(500).send(err)
    }
})

// For deleting a user
router.delete("/users/me",authMiddleware ,async (req, res) => {
    try {
        await req.user.remove()

        // Sending the cancellation email
        sendCancelMail(req.user.email, req.user.name)
        
        res.status(200).send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
})

// Setting up avatar image upload for the user
const upload= multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("Upload image format files only"))
        }

        cb(undefined, true)
    }
})
router.post("/users/me/avatar", authMiddleware ,upload.single("avatar"), async (req, res) => {

    const buffer= await sharp(req.file.buffer).resize({ width : 250, height : 250 }).png().toBuffer()

    // Accessing the file
    req.user.avatar= buffer

    await req.user.save()

    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error : error.message})
})

// Allowing user to delete the uploaded avatar
router.delete("/users/me/avatar", authMiddleware, async(req, res) => {
    try{
        req.user.avatar= undefined
        await req.user.save()
        res.status(200).send("Avatar Deleted !")
    }catch(e){
        res.send(e)
    }
})

// Getting the avatar of the user by its id
router.get("/users/:id/avatar", async (req, res) => {
    try{

        const user= await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set("Content-Type", "image/png")
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})

module.exports = router