const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getProfileController,
  updateProfileController
} = require('../controllers/profile.controller');

router.get('/', authMiddleware.authUser, getProfileController);
router.put('/', authMiddleware.authUser, updateProfileController);

module.exports = router;

