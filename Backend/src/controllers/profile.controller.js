const ProfileModel = require('../models/profile.model');
const userModel = require('../models/user.model');

async function getProfileController(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = await ProfileModel.findOne({ user: req.user.id });
    if (!profile) {
      profile = await ProfileModel.create({
        user: req.user.id,
        fullName: user.username,
        email: user.email,
        title: 'Software Developer',
        aboutMe: '',
        skills: {},
        projects: [],
        experience: [],
        education: [],
        certifications: []
      });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      profile: {
        ...profile.toObject(),
        username: user.username,
        email: profile.email || user.email,
        fullName: profile.fullName || user.username
      }
    });
  } catch (err) {
    console.error('getProfileController error:', err);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

async function updateProfileController(req, res) {
  try {
    const updateData = req.body;
    delete updateData._id;
    delete updateData.user;

    const profile = await ProfileModel.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (err) {
    console.error('updateProfileController error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

module.exports = {
  getProfileController,
  updateProfileController
};

