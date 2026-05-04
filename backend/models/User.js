const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    trim: false,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  resetToken: {
    type: char,
    default: null,
  },
  resetTokenExpiry: {
    type: Time,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

