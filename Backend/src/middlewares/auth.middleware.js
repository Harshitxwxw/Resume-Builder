const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")


const authUser = async (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: Token not provided"
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized: Token is Invalidated"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized: Invalid token"
        })
    }
}

module.exports =  {authUser} 