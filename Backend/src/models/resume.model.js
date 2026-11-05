const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Resume'
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: () => ({})
    },
    layout: {
      type: String,
      default: 'single'
    },
    font: {
      type: String,
      default: 'inter'
    },
    isFinished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const ResumeModel = mongoose.model('Resume', resumeSchema);

module.exports = ResumeModel;

