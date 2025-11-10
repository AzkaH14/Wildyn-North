<<<<<<< HEAD
=======

>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20
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
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
<<<<<<< HEAD
    minlength: 8,
=======
    minlength: 6,
>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20
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

const User = mongoose.model('User', userSchema);

module.exports = User;
<<<<<<< HEAD

=======
>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20
