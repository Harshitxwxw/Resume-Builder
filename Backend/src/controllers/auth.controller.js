const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")


/**
 * @name registerUser
 * @description Register a new user , expects username , email & password in req.body
 * @access Public
 */


async function registerUser(req , res) {
    const {username , email , password } = req.body;

    if(!username || !email || !password){
        return res.status(400).jsom({
            message : "Provide username , email & password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or : [{username} , {email}]
    })

    if(isUserAlreadyExists){
        return res.status(400).json({
            message : "Account is already exists with this email address or username "
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const newUser = await userModel.create({
        username,
        email,
        password : hash
    })

    const token = jwt.sign(
        {id : newUser._id}, 
        process.env.JWT_SECRET, 
        {expiresIn : "1d"}
    )

    res.cookie("token" , token )

    res.status(201).json({
        message : "User registered successfully",
        user : {
            id : newUser._id,
            username : newUser.username,
            email : newUser.email
        }
    })
}

/**
 * 
 * @name loginUser
 * @description Login a user , expects email & password in req.body
 * @access Public
 */
async function loginUser(req , res) {
    const {email , password} = req.body;

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({
            message : "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password , user.password)
    if(!isPasswordValid){
        return res.status(400).json({
            message : "Invalid email or password"
        }) 
    }

    const token = jwt.sign(
        {id : user._id}, 
        process.env.JWT_SECRET, 
        {expiresIn : "1d"}  
    )

    res.cookie("token" , token)

    res.status(200).json({
        message : "User logged in successfully",
        user : {
                id : user._id,
                username : user.username,
                email : user.email
            }
        }
    )
}


/**
 * @name logoutUser
 * @description Logout a user , expects token in req.cookies
 * @access Public
 */

async function logoutUser(req , res) {
    const token = req.cookies.token

    if(token){
        await tokenBlacklistModel.create({token})
    }

    res.clearCookie("token")

    res.status(200).json({
        message : "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description Get the logged in user
 * @access Private
 */
async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "User fetched successfully",
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

module.exports = {registerUser, loginUser, logoutUser, getMeController}