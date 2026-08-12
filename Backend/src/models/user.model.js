const mongoose = require("mongoose")
const strict = require("node:assert/strict")
const { type } = require("node:os")
const { stringify } = require("node:querystring")

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        unique : [true , "username already taken"],
        required : true
    },
    email : {
        type : String,
        unique : [true , "Account already exist with this email"],
        required : true
    }
    ,
    password : {
        type : String,
        required : true
    }
})


const userModel = mongoose.model("users", userSchema)

module.exports = userModel