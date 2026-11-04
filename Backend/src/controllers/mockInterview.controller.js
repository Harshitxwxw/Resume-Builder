const pdf_Parse = require('pdf-parse');
const {
  generateMockInterviewQuestions,
  evaluateMockAnswer,
  generateMockInterviewReport
} = require('../services/ai.service');

/**
 * Setup mock interview: parse resume & generate 5 progressive questions
 */
async function setupMockInterviewController(req, res) {
  try {
    let resumeText = req.body.resumeText || "";

    // Parse PDF file if uploaded
    if (req.file && req.file.buffer) {
      try {
        const pdfParser = new pdf_Parse.PDFParse(Uint8Array.from(req.file.buffer));
        const parsed = await pdfParser.getText();
        if (parsed?.text) {
          resumeText = parsed.text;
        }
      } catch (pdfErr) {
        console.error("PDF parse error in setupMockInterviewController:", pdfErr);
      }
    }

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

    const role = req.body.role || "Software Engineer";
    const experience = req.body.experience || "";
    const interviewType = req.body.interviewType || "Technical Interview";
    const customApiKey = req.body.apiKey || req.headers['x-gemini-key'] || "";

    const interviewSetup = await generateMockInterviewQuestions({
      role,
      experience,
      interviewType,
      resumeText,
      apiKey: customApiKey
    });

    return res.status(200).json({
      message: "Mock interview setup generated successfully",
      result: interviewSetup
    });
  } catch (error) {
    console.error("setupMockInterviewController error:", error);
    return res.status(500).json({
      message: "Failed to setup mock interview",
      error: error.message
    });
  }
}

/**
 * Evaluate single answer & give immediate feedback
 */
async function evaluateAnswerController(req, res) {
  try {
    const { question, answer, role, interviewType, apiKey } = req.body;
    const customApiKey = apiKey || req.headers['x-gemini-key'] || "";

    const evaluation = await evaluateMockAnswer({
      question,
      answer,
      role,
      interviewType,
      apiKey: customApiKey
    });

    return res.status(200).json({
      message: "Answer evaluated successfully",
      result: evaluation
    });
  } catch (error) {
    console.error("evaluateAnswerController error:", error);
    return res.status(500).json({
      message: "Failed to evaluate answer",
      error: error.message
    });
  }
}

/**
 * Generate final analytics report
 */
async function generateReportController(req, res) {
  try {
    const sessionData = req.body;
    const customApiKey = req.body.apiKey || req.headers['x-gemini-key'] || "";

    const report = await generateMockInterviewReport({
      sessionData,
      apiKey: customApiKey
    });

    return res.status(200).json({
      message: "Interview analytics report generated successfully",
      result: report
    });
  } catch (error) {
    console.error("generateReportController error:", error);
    return res.status(500).json({
      message: "Failed to generate analytics report",
      error: error.message
    });
  }
}

module.exports = {
  setupMockInterviewController,
  evaluateAnswerController,
  generateReportController
};

