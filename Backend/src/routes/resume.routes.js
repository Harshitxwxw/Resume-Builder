const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getResumesController,
  getResumeByIdController,
  createOrUpdateResumeController,
  deleteResumeController
} = require('../controllers/resume.controller');

router.get('/', authMiddleware.authUser, getResumesController);
router.post('/', authMiddleware.authUser, createOrUpdateResumeController);
router.get('/:id', authMiddleware.authUser, getResumeByIdController);
router.delete('/:id', authMiddleware.authUser, deleteResumeController);

module.exports = router;

