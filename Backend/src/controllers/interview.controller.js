const pdf_Parse = require('pdf-parse')
const generateInterviewReport = require('../services/ai.service')
const InterviewReportModel = require('../models/interviewReport.model')

async function generateInterviewReportController(req , res) {
    const resumeFile = req.file

    const resumeContent = await (new pdf_Parse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const { self_description , job_description } = req.body;

    const interviewReportByAi = await generateInterviewReport({
        resume : resumeContent.text, 
        self_description , 
        job_description
    })

    const parsedAiReport = typeof interviewReportByAi === 'string' 
    ? JSON.parse(interviewReportByAi) 
    : interviewReportByAi;
    
    const interviewReport = await InterviewReportModel.create({
        user : req.user.id,
        resume : resumeContent.text,
        selfDescription : self_description,
        jobDescription : job_description,
        ...parsedAiReport
    })
    
    res.status(201).json({
        message : "Interview report generated successfully",
        interviewReport
    })
}


async function getInterviewReportBy_Id(req, res) {
    const {interviewId} = req.params;

    const interview_Report = await InterviewReportModel.findOne({
        _id : interviewId, 
        user : req.user.id
    })

    if(!interview_Report){
        res.status(404).json({
            message : "Interview Report not found"
        })
    }

    res.status(200).json({
        message : "Interview Report fetched successfully"
    })
}


async function getAll_InterviewReports(req , res) {
    const interviewReports = await InterviewReportModel.find({
        user : req.user.id
    }).sort({ createdAt : -1}).select("-resume -selfDescription -jobDescription -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -__v")

    res.status(200).json({
        message : "Interview reports fetched successfully"
    })
}


module.exports = {generateInterviewReportController , getInterviewReportBy_Id , getAll_InterviewReports}