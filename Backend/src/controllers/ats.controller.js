const pdf_Parse = require('pdf-parse');
const { calculateAtsScore, enhanceResume } = require('../services/ai.service');

async function calculateAtsScoreController(req, res) {
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
        console.error("PDF parse error in calculateAtsScoreController:", pdfErr);
      }
    }

    // If resumeData object was passed instead of raw text
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

    const jobTitle = req.body.jobTitle || req.body.targetRole || "";
    const jobDescription = req.body.jobDescription || req.body.job_description || "";
    const customApiKey = req.body.apiKey || req.headers['x-gemini-key'] || "";

    if (!resumeText.trim() && !jobDescription.trim()) {
      return res.status(400).json({
        message: "Please provide a resume and target job details."
      });
    }

    const evaluationResult = await calculateAtsScore({
      resumeText,
      jobTitle,
      jobDescription,
      apiKey: customApiKey
    });

    return res.status(200).json({
      message: "ATS score calculated successfully",
      result: evaluationResult
    });
  } catch (error) {
    console.error("calculateAtsScoreController error:", error);
    return res.status(500).json({
      message: "Failed to calculate ATS score",
      error: error.message
    });
  }
}

async function enhanceResumeController(req, res) {
  try {
    const resumeData = req.body.resumeData || null;
    const resumeText = req.body.resumeText || "";
    const targetRole = req.body.targetRole || req.body.jobTitle || "";
    const jobDescription = req.body.jobDescription || "";
    const enhancementFocus = req.body.enhancementFocus || "all";
    const customApiKey = req.body.apiKey || req.headers['x-gemini-key'] || "";

    if (!resumeData && !resumeText.trim()) {
      return res.status(400).json({
        message: "Please provide resume data or text to enhance."
      });
    }

    const enhancedResult = await enhanceResume({
      resumeData,
      resumeText,
      targetRole,
      jobDescription,
      enhancementFocus,
      apiKey: customApiKey
    });

    return res.status(200).json({
      message: "Resume enhanced successfully",
      result: enhancedResult
    });
  } catch (error) {
    console.error("enhanceResumeController error:", error);
    return res.status(500).json({
      message: "Failed to enhance resume",
      error: error.message
    });
  }
}

module.exports = {
  calculateAtsScoreController,
  enhanceResumeController
};

