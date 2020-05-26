const express = require("express")
// Importing the mongoose file to connect to the DB
require("./db/mongoose")

// Importing the modules
const User = require("./models/users")
const Task = require("./models/tasks")

// Importing the routes
const userRouter= require("./routers/user")
const taskRouter= require("./routers/task")

const app = express()
const port = process.env.PORT 

// To get the json as an object
app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log("Server is running on port " + port)
})
