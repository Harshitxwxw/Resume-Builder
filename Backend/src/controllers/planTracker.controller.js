const PlanTrackerModel = require('../models/planTracker.model');
const userModel = require('../models/user.model');
const CreditTransactionModel = require('../models/creditTransaction.model');

async function getOrCreateTracker(userId) {
  let tracker = await PlanTrackerModel.findOne({ user: userId });
  if (!tracker) {
    tracker = await PlanTrackerModel.create({
      user: userId,
      trackedPlanIds: [],
      completedTasks: [],
      awardedDays: []
    });
  }
  return tracker;
}

async function getPlanTrackerController(req, res) {
  try {
    const tracker = await getOrCreateTracker(req.user.id);
    return res.status(200).json({
      trackedPlanIds: tracker.trackedPlanIds || [],
      completedTasks: tracker.completedTasks || [],
      awardedDays: tracker.awardedDays || []
    });
  } catch (err) {
    console.error('getPlanTrackerController error:', err);
    return res.status(500).json({ message: 'Failed to fetch plan tracker' });
  }
}

async function toggleTrackPlanController(req, res) {
  try {
    const { planId, shouldTrack } = req.body;
    if (!planId) {
      return res.status(400).json({ message: 'planId is required' });
    }

    const tracker = await getOrCreateTracker(req.user.id);
    const idStr = String(planId);
    let ids = tracker.trackedPlanIds.map(String);

    if (shouldTrack) {
      if (!ids.includes(idStr)) ids.push(idStr);
    } else {
      ids = ids.filter((id) => id !== idStr);
    }

    tracker.trackedPlanIds = ids;
    await tracker.save();

    return res.status(200).json({
      success: true,
      trackedPlanIds: tracker.trackedPlanIds
    });
  } catch (err) {
    console.error('toggleTrackPlanController error:', err);
    return res.status(500).json({ message: 'Failed to update tracked plans' });
  }
}

async function toggleTaskCompletionController(req, res) {
  try {
    const { taskId, completed } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    const tracker = await getOrCreateTracker(req.user.id);
    const idStr = String(taskId);
    let tasks = tracker.completedTasks.map(String);

    if (completed) {
      if (!tasks.includes(idStr)) tasks.push(idStr);
    } else {
      tasks = tasks.filter((t) => t !== idStr);
    }

    tracker.completedTasks = tasks;
    await tracker.save();

    return res.status(200).json({
      success: true,
      completedTasks: tracker.completedTasks
    });
  } catch (err) {
    console.error('toggleTaskCompletionController error:', err);
    return res.status(500).json({ message: 'Failed to update task completion' });
  }
}

async function awardPlanDayController(req, res) {
  try {
    const { planId, dayNum, dayTitle } = req.body;
    if (!planId || dayNum === undefined) {
      return res.status(400).json({ message: 'planId and dayNum are required' });
    }

    const rewardKey = `${planId}_day_${dayNum}`;
    const tracker = await getOrCreateTracker(req.user.id);
    const awarded = tracker.awardedDays.map(String);

    if (awarded.includes(rewardKey)) {
      return res.status(200).json({
        awarded: false,
        message: 'Reward already claimed for this day'
      });
    }

    // Award +15 credits
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = typeof user.credits === 'number' ? user.credits : 100;
    const newBalance = currentBalance + 15;
    user.credits = newBalance;
    await user.save();

    await CreditTransactionModel.create({
      user: req.user.id,
      type: 'earned',
      amount: 15,
      reason: `Completed Day ${dayNum} Tasks: ${dayTitle || 'Daily Prep Plan'}`,
      balance: newBalance
    });

    awarded.push(rewardKey);
    tracker.awardedDays = awarded;
    await tracker.save();

    return res.status(200).json({
      awarded: true,
      amount: 15,
      balance: newBalance,
      awardedDays: tracker.awardedDays
    });
  } catch (err) {
    console.error('awardPlanDayController error:', err);
    return res.status(500).json({ message: 'Failed to award plan day credits' });
  }
}

module.exports = {
  getPlanTrackerController,
  toggleTrackPlanController,
  toggleTaskCompletionController,
  awardPlanDayController
};

