const express = require("express");
const interviewRouter = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require('../controllers/interview.controller')
const upload = require('../middlewares/file.middleware')

/**
 * @routes POST  /api/interview
 * @description generate an interview report for the candidate based on the provided resume, self-description, and job description
 * @returns {matchscore, technicalQuestions, behavioralQuestions, skillgaps, preparationPlan}
 * @access Private
 */

interviewRouter.post("/" , authMiddleware.authUser , upload.single("resume"), interviewController.generateInterviewReportController)


/**
 * @routes GET  /api/interview/interviewId
 * @description get interivew report by interviewId
 * @access Private
 */

interviewRouter.get("/report/:interviewId" , authMiddleware.authUser , interviewController.getInterviewReportBy_Id)


/**
 * @routes GET  /api/interview/interviewId
 * @description get all interivew report by interviewId
 * @access Private
 */

interviewRouter.get("/reports" , authMiddleware.authUser , interviewController.getAll_InterviewReports)



module.exports = interviewRouter;