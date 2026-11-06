const express = require("express");
const atsRouter = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const atsController = require("../controllers/ats.controller");
const upload = require("../middlewares/file.middleware");

/**
 * @routes POST /api/ats/calculate
 * @description calculate ATS score using AI
 * @access Private
 */
atsRouter.post(
  "/calculate",
  authMiddleware.authUser,
  upload.single("resume"),
  atsController.calculateAtsScoreController
);

/**
 * @routes POST /api/ats/enhance
 * @description enhance resume using AI for high ATS score
 * @access Private
 */
atsRouter.post(
  "/enhance",
  authMiddleware.authUser,
  atsController.enhanceResumeController
);

module.exports = atsRouter;

