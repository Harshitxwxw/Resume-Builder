const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')


// require all routes 
const authRouter = require('./routes/auth.routes')
const interviewRouter = require('./routes/interview.routes')
const atsRouter = require('./routes/ats.routes')
const mockInterviewRouter = require('./routes/mockInterview.routes')
const resumeRouter = require('./routes/resume.routes')
const creditRouter = require('./routes/credit.routes')
const planTrackerRouter = require('./routes/planTracker.routes')
const profileRouter = require('./routes/profile.routes')
const wishlistRouter = require('./routes/wishlist.routes')

// Trust reverse proxy for secure cookies on Render/Heroku/Vercel
app.set("trust proxy", 1)

// Allowed origins including deployed frontend
const allowedOrigins = [
    "https://career-ai-7i4h.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
].filter(Boolean)

// middleware 
app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        if (/https:\/\/.*\.onrender\.com$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}))

/// use routes
app.use("/api/auth" , authRouter)
app.use("/api/interview" , interviewRouter)
app.use("/api/ats", atsRouter)
app.use("/api/mock-interview", mockInterviewRouter)
app.use("/api/resumes", resumeRouter)
app.use("/api/credits", creditRouter)
app.use("/api/plan-tracker", planTrackerRouter)
app.use("/api/profile", profileRouter)
app.use("/api/wishlist", wishlistRouter)





module.exports = app