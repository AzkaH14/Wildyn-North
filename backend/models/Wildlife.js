<<<<<<< HEAD
=======

>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20
const mongoose = require('mongoose');

const wildlifeSchema = new mongoose.Schema({
  commonName: {
    type: String,
    required: true,
  },
  scientificName: {
    type: String,
    required: true,
  },
  urduName: {
    type: String,
    default: '',
  },
  family: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  habitat: {
    type: String,
    default: '',
  },
  distribution: {
    type: String,
    default: '',
  },
  conservationStatus: {
    type: String,
    default: '',
  },
  imageUri: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Wildlife = mongoose.model('Wildlife', wildlifeSchema);

module.exports = Wildlife;
