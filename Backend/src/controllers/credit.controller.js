const userModel = require('../models/user.model');
const CreditTransactionModel = require('../models/creditTransaction.model');

async function getCreditsController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const credits = typeof user.credits === 'number' ? user.credits : 100;
    const history = await CreditTransactionModel.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(40);

    return res.status(200).json({
      credits,
      history
    });
  } catch (err) {
    console.error('getCreditsController error:', err);
    return res.status(500).json({ message: 'Failed to fetch credits' });
  }
}

async function deductCreditsController(req, res) {
  try {
    const { amount, reason } = req.body;
    const deductAmt = Math.abs(parseInt(amount, 10)) || 50;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = typeof user.credits === 'number' ? user.credits : 100;
    if (currentBalance < deductAmt) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
        current: currentBalance,
        needed: deductAmt,
        shortage: deductAmt - currentBalance
      });
    }

    const newBalance = currentBalance - deductAmt;
    user.credits = newBalance;
    await user.save();

    const transaction = await CreditTransactionModel.create({
      user: req.user.id,
      type: 'spent',
      amount: deductAmt,
      reason: reason || 'Mock AI Interview Simulation',
      balance: newBalance
    });

    return res.status(200).json({
      success: true,
      balance: newBalance,
      transaction
    });
  } catch (err) {
    console.error('deductCreditsController error:', err);
    return res.status(500).json({ message: 'Failed to deduct credits' });
  }
}

async function awardCreditsController(req, res) {
  try {
    const { amount, reason } = req.body;
    const awardAmt = Math.abs(parseInt(amount, 10)) || 15;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = typeof user.credits === 'number' ? user.credits : 100;
    const newBalance = currentBalance + awardAmt;
    user.credits = newBalance;
    await user.save();

    const transaction = await CreditTransactionModel.create({
      user: req.user.id,
      type: 'earned',
      amount: awardAmt,
      reason: reason || 'Credits earned',
      balance: newBalance
    });

    return res.status(200).json({
      success: true,
      balance: newBalance,
      transaction
    });
  } catch (err) {
    console.error('awardCreditsController error:', err);
    return res.status(500).json({ message: 'Failed to award credits' });
  }
}

module.exports = {
  getCreditsController,
  deductCreditsController,
  awardCreditsController
};

