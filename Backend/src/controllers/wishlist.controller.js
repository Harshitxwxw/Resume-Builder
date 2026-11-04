const WishlistModel = require('../models/wishlist.model');

async function getOrCreateWishlist(userId) {
  let wishlist = await WishlistModel.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await WishlistModel.create({
      user: userId,
      reports: [],
      resumes: []
    });
  }
  return wishlist;
}

async function getWishlistController(req, res) {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);
    await wishlist.populate('reports');
    await wishlist.populate('resumes');

    return res.status(200).json({
      reports: wishlist.reports || [],
      resumes: wishlist.resumes || []
    });
  } catch (err) {
    console.error('getWishlistController error:', err);
    return res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
}

async function toggleWishlistController(req, res) {
  try {
    const { type, itemId } = req.body; // type: 'report' or 'resume'
    if (!type || !itemId) {
      return res.status(400).json({ message: 'type and itemId are required' });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);
    const idStr = String(itemId);

    if (type === 'report') {
      const idx = wishlist.reports.findIndex((r) => String(r._id || r) === idStr);
      if (idx >= 0) {
        wishlist.reports.splice(idx, 1);
      } else {
        wishlist.reports.push(itemId);
      }
    } else if (type === 'resume') {
      const idx = wishlist.resumes.findIndex((r) => String(r._id || r) === idStr);
      if (idx >= 0) {
        wishlist.resumes.splice(idx, 1);
      } else {
        wishlist.resumes.push(itemId);
      }
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      reports: wishlist.reports,
      resumes: wishlist.resumes
    });
  } catch (err) {
    console.error('toggleWishlistController error:', err);
    return res.status(500).json({ message: 'Failed to toggle wishlist' });
  }
}

module.exports = {
  getWishlistController,
  toggleWishlistController
};

