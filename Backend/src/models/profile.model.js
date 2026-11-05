const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true
    },
    fullName: { type: String, default: '' },
    title: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    aboutMe: { type: String, default: '' },
    skills: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    projects: { type: Array, default: () => [] },
    experience: { type: Array, default: () => [] },
    education: { type: Array, default: () => [] },
    certifications: { type: Array, default: () => [] }
  },
  {
    timestamps: true
  }
);

const ProfileModel = mongoose.model('Profile', profileSchema);

module.exports = ProfileModel;

