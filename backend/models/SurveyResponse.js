const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true,
  },
  surveyTitle: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Anonymous' },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
