const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewReport'
      }
    ],
    resumes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume'
      }
    ]
  },
  {
    timestamps: true
  }
);

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);

module.exports = WishlistModel;

