const MockInterviewReportModel = require('../models/mockInterviewReport.model');

async function getMockReportsController(req, res) {
  try {
    const mockReports = await MockInterviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      message: 'Mock interview reports fetched successfully',
      mockReports
    });
  } catch (err) {
    console.error('getMockReportsController error:', err);
    return res.status(500).json({ message: 'Failed to fetch mock reports' });
  }
}

async function saveMockReportController(req, res) {
  try {
    const { role, interviewType, score, performanceLevel, totalQuestions, feedbackSummary, answers } = req.body;

    const report = await MockInterviewReportModel.create({
      user: req.user.id,
      role: role || 'AI Mock Interview',
      interviewType: interviewType || 'technical',
      score: typeof score === 'number' ? score : parseFloat(score) || 0,
      performanceLevel: performanceLevel || 'Needs Improvement',
      totalQuestions: totalQuestions || 5,
      feedbackSummary: feedbackSummary || '',
      answers: Array.isArray(answers) ? answers : []
    });

    return res.status(201).json({
      message: 'Mock interview report saved successfully',
      report
    });
  } catch (err) {
    console.error('saveMockReportController error:', err);
    return res.status(500).json({ message: 'Failed to save mock report' });
  }
}

async function deleteMockReportController(req, res) {
  try {
    const { id } = req.params;
    await MockInterviewReportModel.findOneAndDelete({ _id: id, user: req.user.id });
    return res.status(200).json({
      message: 'Mock report deleted successfully'
    });
  } catch (err) {
    console.error('deleteMockReportController error:', err);
    return res.status(500).json({ message: 'Failed to delete mock report' });
  }
}

module.exports = {
  getMockReportsController,
  saveMockReportController,
  deleteMockReportController
};

