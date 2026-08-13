const express = require("express")
const authRouter = express.Router()
const authController = require("../controllers/auth.controller")
const authMiddleware  = require("../middlewares/auth.middleware")

/**
 * @routes POST  /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUser )


/**
 * @routes POST  /api/auth/login
 * @description Login a user
 * @access Public
 */
authRouter.post("/login", authController.loginUser )


/**
 * @routes GET  /api/auth/logout
 * @description Logout a user
 * @access Public
 */
authRouter.get("/logout", authController.logoutUser )


/**
 * @routes GET  /api/auth/get-me
 * @description Get the logged in user
 * @access Private
 */
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)


module.exports = authRouter