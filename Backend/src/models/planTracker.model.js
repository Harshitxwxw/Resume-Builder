const mongoose = require('mongoose');

const planTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true
    },
    trackedPlanIds: [
      {
        type: String
      }
    ],
    completedTasks: [
      {
        type: String
      }
    ],
    awardedDays: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

const PlanTrackerModel = mongoose.model('PlanTracker', planTrackerSchema);

module.exports = PlanTrackerModel;

