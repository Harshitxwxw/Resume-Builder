const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getWishlistController,
  toggleWishlistController
} = require('../controllers/wishlist.controller');

router.get('/', authMiddleware.authUser, getWishlistController);
router.post('/toggle', authMiddleware.authUser, toggleWishlistController);

module.exports = router;

