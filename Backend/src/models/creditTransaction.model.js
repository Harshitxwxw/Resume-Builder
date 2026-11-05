const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['earned', 'spent'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const CreditTransactionModel = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = CreditTransactionModel;

