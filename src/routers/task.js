const express= require("express")
const router= new express.Router()
const authMiddleware= require("../middleware/authMiddle")
const Task= require("../models/tasks")


// For creating a task
// Linking the creator of the task as well
router.post("/tasks", authMiddleware , async (req, res) => {
    const task= new Task({
        ...req.body,
        owner : req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

// For fetching all the tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", authMiddleware , async (req, res) => {

        const match={}
        const sort= {}
        if(req.query.completed){
            match.completed= req.query.completed==="true"
        }

        if(req.query.sortBy){
            const parts= req.query.sortBy.split(":")
            sort[parts[0]]= parts[1] === "desc" ? -1 : 1
        }

        try{
            await req.user.populate({
                path : "userTasks",
                match,
                options : {
                    limit : parseInt(req.query.limit),
                    skip : parseInt(req.query.skip),
                    sort 
                }
            }).execPopulate()

            res.status(200).send(req.user.userTasks)
        }catch (err) {
        res.status(500).send(err) 
        }

})
// Fetch a task by its id
router.get("/tasks/:id", authMiddleware , async (req, res) => {
    const _id = req.params.id

    try {
        // const task = await Task.findById(_id)
        const task= await Task.findOne({_id : _id, owner : req.user._id})

        if (!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (err) {
        res.status(500).send(err)
    }

})

// Updating a task by its id
router.patch("/tasks/:id",authMiddleware , async (req, res) => {
    const updatesToDo= Object.keys(req.body)
    const allowedUpdates= ["description", "completed"]
    const isValidOperation= updatesToDo.every((update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error : "Invalid Updation !"})
    }

    try{
        const task= await Task.findOne({_id : req.params.id, owner : req.user._id})

        if(!task){
            return res.status(404).send()
        }

        updatesToDo.forEach((update) => {
            task[update]= req.body[update]
        })

        await task.save()
        res.status(200).send(task)

    }catch(err){
        res.status(500).send(err)
    }
})

// For deleting a task
router.delete("/tasks/:id", authMiddleware , async (req, res) => {
    try{
        const task= await Task.findOneAndDelete({_id : req.params.id, owner : req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.status(200).send(task)
    }catch(err){
        res.status(500).send(err)
    }
})

module.exports= router