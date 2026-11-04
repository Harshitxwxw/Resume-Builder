const pdf_Parse = require('pdf-parse')
const generateInterviewReport = require('../services/ai.service')
const InterviewReportModel = require('../models/interviewReport.model')

async function generateInterviewReportController(req, res) {
    try {
        let resumeText = "";

        if (req.file && req.file.buffer) {
            try {
                const pdfParser = new pdf_Parse.PDFParse(Uint8Array.from(req.file.buffer));
                const parsed = await pdfParser.getText();
                resumeText = parsed?.text || "";
            } catch (pdfErr) {
                console.error("PDF parse error:", pdfErr);
                resumeText = "";
            }
        }

        // Support saved existing resumes passed as structured JSON or text
        if (!resumeText && req.body.resumeData) {
            try {
                const data = typeof req.body.resumeData === 'string'
                    ? JSON.parse(req.body.resumeData)
                    : req.body.resumeData;
                resumeText = JSON.stringify(data, null, 2);
            } catch (e) {
                resumeText = String(req.body.resumeData);
            }
        }

        if (!resumeText && req.body.resumeText) {
            resumeText = String(req.body.resumeText);
        }

        const selfDescription = req.body.self_description || req.body.selfDescription || "";
        const jobDescription = req.body.job_description || req.body.jobDescription || "";

        if (!jobDescription.trim() && !selfDescription.trim() && !resumeText.trim()) {
            return res.status(400).json({
                message: "Please provide a Job Description, Self Description, or Resume file / saved resume."
            });
        }

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            self_description: selfDescription,
            job_description: jobDescription
        });

        const parsedAiReport = typeof interviewReportByAi === 'string'
            ? JSON.parse(interviewReportByAi)
            : interviewReportByAi;

        const interviewReport = await InterviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription,
            jobDescription: jobDescription,
            ...parsedAiReport
        });

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport
        });
    } catch (error) {
        console.error("generateInterviewReportController error:", error);
        res.status(500).json({
            message: error.message || "Failed to generate interview report"
        });
    }
}

async function getInterviewReportBy_Id(req, res) {
    try {
        const { interviewId } = req.params;

        const interview_Report = await InterviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        });

        if (!interview_Report) {
            return res.status(404).json({
                message: "Interview Report not found"
            });
        }

        res.status(200).json({
            message: "Interview Report fetched successfully",
            interviewReport: interview_Report
        });
    } catch (error) {
        console.error("getInterviewReportBy_Id error:", error);
        res.status(500).json({
            message: "Failed to fetch interview report"
        });
    }
}

async function getAll_InterviewReports(req, res) {
    try {
        const interviewReports = await InterviewReportModel.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        });
    } catch (error) {
        console.error("getAll_InterviewReports error:", error);
        res.status(500).json({
            message: "Failed to fetch interview reports"
        });
    }
}

async function toggleTrackReportController(req, res) {
    try {
        const { interviewId } = req.params;

        const report = await InterviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        });

        if (!report) {
            return res.status(404).json({
                message: "Interview Report not found"
            });
        }

        report.isTracked = !report.isTracked;
        await report.save();

        res.status(200).json({
            message: `Plan ${report.isTracked ? 'tracked' : 'untracked'} successfully`,
            isTracked: report.isTracked,
            interviewReport: report
        });
    } catch (error) {
        console.error("toggleTrackReportController error:", error);
        res.status(500).json({
            message: error.message || "Failed to update tracking status"
        });
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportBy_Id,
    getAll_InterviewReports,
    toggleTrackReportController
};
