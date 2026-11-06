const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getPlanTrackerController,
  toggleTrackPlanController,
  toggleTaskCompletionController,
  awardPlanDayController
} = require('../controllers/planTracker.controller');

router.get('/', authMiddleware.authUser, getPlanTrackerController);
router.post('/track', authMiddleware.authUser, toggleTrackPlanController);
router.post('/task', authMiddleware.authUser, toggleTaskCompletionController);
router.post('/award-day', authMiddleware.authUser, awardPlanDayController);

module.exports = router;

