const ResumeModel = require('../models/resume.model');

async function getResumesController(req, res) {
  try {
    const resumes = await ResumeModel.find({ user: req.user.id }).sort({ updatedAt: -1 });
    return res.status(200).json({
      message: 'Resumes fetched successfully',
      resumes
    });
  } catch (err) {
    console.error('getResumesController error:', err);
    return res.status(500).json({ message: 'Failed to fetch resumes' });
  }
}

async function getResumeByIdController(req, res) {
  try {
    const { id } = req.params;
    const resume = await ResumeModel.findOne({ _id: id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    return res.status(200).json({
      message: 'Resume fetched successfully',
      resume
    });
  } catch (err) {
    console.error('getResumeByIdController error:', err);
    return res.status(500).json({ message: 'Failed to fetch resume' });
  }
}

async function createOrUpdateResumeController(req, res) {
  try {
    const { id, title, data, layout, font, isFinished } = req.body;
    let resume;

    if (id && id.length === 24) {
      // If valid mongo id, try to find and update
      resume = await ResumeModel.findOne({ _id: id, user: req.user.id });
    }

    if (resume) {
      if (title !== undefined) resume.title = title;
      if (data !== undefined) resume.data = data;
      if (layout !== undefined) resume.layout = layout;
      if (font !== undefined) resume.font = font;
      if (isFinished !== undefined) resume.isFinished = isFinished;
      await resume.save();
    } else {
      resume = await ResumeModel.create({
        user: req.user.id,
        title: title || data?.personal?.fullName ? `${data.personal.fullName} - ${data.personal.profession || 'Resume'}` : 'Untitled Resume',
        data: data || {},
        layout: layout || 'single',
        font: font || 'inter',
        isFinished: isFinished !== false
      });
    }

    return res.status(200).json({
      message: 'Resume saved successfully',
      resume
    });
  } catch (err) {
    console.error('createOrUpdateResumeController error:', err);
    return res.status(500).json({ message: 'Failed to save resume' });
  }
}

async function deleteResumeController(req, res) {
  try {
    const { id } = req.params;
    await ResumeModel.findOneAndDelete({ _id: id, user: req.user.id });
    return res.status(200).json({
      message: 'Resume deleted successfully'
    });
  } catch (err) {
    console.error('deleteResumeController error:', err);
    return res.status(500).json({ message: 'Failed to delete resume' });
  }
}

module.exports = {
  getResumesController,
  getResumeByIdController,
  createOrUpdateResumeController,
  deleteResumeController
};

