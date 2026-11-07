const mongoose = require('mongoose')



async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to DB");
    } catch (err) {
        console.error("DB connection failed:", err.message)
        process.exit(1)
    }

}

module.exports = connectToDB
