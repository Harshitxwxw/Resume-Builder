require("dotenv").config()
const app = require("./src/app")
const invokeGemini = require("./src/services/ai.service")
const connectDB = require("./src/config/database")


connectDB()


app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
    
})