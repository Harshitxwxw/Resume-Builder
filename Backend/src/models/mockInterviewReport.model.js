const mongoose = require('mongoose');

const mockInterviewReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true
    },
    role: {
      type: String,
      required: true,
      default: 'Technical Interview'
    },
    interviewType: {
      type: String,
      enum: ['technical', 'hr'],
      default: 'technical'
    },
    score: {
      type: Number,
      required: true,
      default: 0
    },
    performanceLevel: {
      type: String,
      default: 'Needs Improvement'
    },
    totalQuestions: {
      type: Number,
      default: 5
    },
    feedbackSummary: {
      type: String,
      default: ''
    },
    answers: [
      {
        question: { type: String },
        answer: { type: String },
        feedback: { type: String },
        score: { type: Number },
        difficulty: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

const MockInterviewReportModel = mongoose.model('MockInterviewReport', mockInterviewReportSchema);

module.exports = MockInterviewReportModel;

