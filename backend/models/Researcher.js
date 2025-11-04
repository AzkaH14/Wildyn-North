const mongoose = require('mongoose');

const researcherSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  userType: {
    type: String,
    default: 'researcher',
    enum: ['researcher'],
  },
  education: {
    highestDegree: {
      type: String,
      required: true,
    },
    fieldOfStudy: {
      type: String,
      required: true,
    },
    institution: {
      type: String,
      required: true,
    },
    graduationYear: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    certifications: {
      type: String,
      default: '',
    },
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Researcher = mongoose.model('Researcher', researcherSchema);

module.exports = Researcher;

