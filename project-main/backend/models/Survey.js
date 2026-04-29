const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'textarea', 'dropdown', 'checkbox', 'date', 'time'],
    default: 'text',
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  options: [{ type: String }],
});

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  fields: [fieldSchema],
  researcherId: { type: String, required: true },
  researcherName: { type: String, required: true },
  targetSpecies: {
    type: [String],
    default: [],
    // e.g. ['Markhor', 'Snow Leopard', 'Himalayan Brown Bear', 'Ibex', 'Himalayan Wolf']
  },
  region: {
    type: String,
    default: 'Northern Pakistan (Himalayan / Karakoram)',
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  createdAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Survey', surveySchema);
