const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  setupMockInterviewController,
  evaluateAnswerController,
  generateReportController
} = require('../controllers/mockInterview.controller');
const {
  getMockReportsController,
  saveMockReportController,
  deleteMockReportController
} = require('../controllers/mockReport.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/setup', upload.single('resumePdf'), setupMockInterviewController);
router.post('/evaluate', evaluateAnswerController);
router.post('/report', generateReportController);

// Persistent mock reports stored in Database per user
router.get('/reports', authMiddleware.authUser, getMockReportsController);
router.post('/reports', authMiddleware.authUser, saveMockReportController);
router.delete('/reports/:id', authMiddleware.authUser, deleteMockReportController);

module.exports = router;

