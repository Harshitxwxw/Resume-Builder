const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')


// require all routes 
const authRouter = require('./routes/auth.routes')
const interviewRouter = require('./routes/interview.routes')



// middleware 
app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

/// use routes
app.use("/api/auth" , authRouter)
app.use("/api/interview" , interviewRouter)





module.exports = app