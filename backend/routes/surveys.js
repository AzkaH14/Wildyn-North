const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');

// ─── RESEARCHER: Create a new survey (draft) ──────────────────────────────
// POST /api/surveys
router.post('/', async (req, res) => {
  try {
    const { title, description, fields, researcherId, researcherName, targetSpecies, region } = req.body;

    if (!title || !researcherId || !researcherName) {
      return res.status(400).json({ message: 'title, researcherId and researcherName are required' });
    }

    const survey = new Survey({
      title,
      description,
      fields: fields || [],
      researcherId,
      researcherName,
      targetSpecies: targetSpecies || [],
      region: region || 'Northern Pakistan (Himalayan / Karakoram)',
      status: 'draft',
    });

    await survey.save();
    res.status(201).json({ message: 'Survey created', survey });
  } catch (err) {
    console.error('Create survey error:', err);
    res.status(500).json({ message: 'Failed to create survey' });
  }
});

// ─── RESEARCHER: Publish a survey (users will see it) ────────────────────
// PATCH /api/surveys/:id/publish
router.patch('/:id/publish', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });

    survey.status = 'published';
    survey.publishedAt = new Date();
    await survey.save();

    res.json({ message: 'Survey published', survey });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish survey' });
  }
});

// ─── RESEARCHER: Get their own surveys ───────────────────────────────────
// GET /api/surveys/researcher/:researcherId
router.get('/researcher/:researcherId', async (req, res) => {
  try {
    const surveys = await Survey.find({ researcherId: req.params.researcherId }).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch surveys' });
  }
});

// ─── USER: Get all published surveys ─────────────────────────────────────
// GET /api/surveys/published
router.get('/published', async (req, res) => {
  try {
    const surveys = await Survey.find({ status: 'published' })
      .select('title description researcherName targetSpecies region publishedAt fields')
      .sort({ publishedAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch published surveys' });
  }
});

// ─── USER: Get single survey by ID ───────────────────────────────────────
// GET /api/surveys/:id
router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch survey' });
  }
});

// ─── USER: Submit a response ──────────────────────────────────────────────
// POST /api/surveys/:id/respond
router.post('/:id/respond', async (req, res) => {
  try {
    const { userId, userName, answers } = req.body;
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });

    const response = new SurveyResponse({
      surveyId: survey._id,
      surveyTitle: survey.title,
      userId: userId || 'anonymous',
      userName: userName || 'Anonymous',
      answers,
    });

    await response.save();
    res.status(201).json({ message: 'Response submitted successfully' });
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ message: 'Failed to submit response' });
  }
});

// ─── RESEARCHER: Get all responses for a survey ──────────────────────────
// GET /api/surveys/:id/responses
router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await SurveyResponse.find({ surveyId: req.params.id }).sort({ submittedAt: -1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = responses.filter(r => new Date(r.submittedAt) >= todayStart).length;

    res.json({ total: responses.length, todayCount, responses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
});

// ─── RESEARCHER: Delete a survey ─────────────────────────────────────────
// DELETE /api/surveys/:id
router.delete('/:id', async (req, res) => {
  try {
    await Survey.findByIdAndDelete(req.params.id);
    await SurveyResponse.deleteMany({ surveyId: req.params.id });
    res.json({ message: 'Survey deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete survey' });
  }
});

module.exports = router;
