const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getCreditsController,
  deductCreditsController,
  awardCreditsController
} = require('../controllers/credit.controller');

router.get('/', authMiddleware.authUser, getCreditsController);
router.post('/deduct', authMiddleware.authUser, deductCreditsController);
router.post('/award', authMiddleware.authUser, awardCreditsController);

module.exports = router;

