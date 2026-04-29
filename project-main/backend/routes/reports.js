const express = require('express');
const router  = express.Router();
const Report  = require('../models/Report');
const axios   = require('axios');

// ─────────────────────────────────────────────────────────────
// 🔑 Environment keys
// ─────────────────────────────────────────────────────────────
const MAPTILER_KEY = process.env.MAPTILER_KEY;

// ─────────────────────────────────────────────────────────────
// 🌍 Reverse Geocoding (MapTiler)
// ─────────────────────────────────────────────────────────────
const getAreaName = async (lat, lng) => {
  try {
    if (!MAPTILER_KEY) {
      console.error('❌ MAPTILER_KEY is not set in environment variables');
      return 'Unknown Area';
    }
    const res  = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}`);
    const data = await res.json();
    return data.features?.[0]?.place_name || 'Unknown Area';
  } catch (err) {
    console.log('Geocoding error:', err);
    return 'Unknown Area';
  }
};

// ─────────────────────────────────────────────────────────────
// ⏱️ Time Ago Helper
// ─────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60)    return `${seconds}s ago`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ─────────────────────────────────────────────────────────────
// 📏 Haversine Distance Helper
// ─────────────────────────────────────────────────────────────
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─────────────────────────────────────────────────────────────
// 🖼️ Base64 Extractor (for animal validation)
// ─────────────────────────────────────────────────────────────
const extractBase64 = (dataUri) => {
  if (!dataUri) return { imageData: null, imageType: 'image/jpeg' };
  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (match) return { imageType: match[1], imageData: match[2] };
  return { imageData: dataUri, imageType: 'image/jpeg' };
};

// ─────────────────────────────────────────────────────────────
// 🐾 Animal Detection Labels — HuggingFace ResNet
// ─────────────────────────────────────────────────────────────
const ANIMAL_LABEL_HINTS = [
  'animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'insect',
  'canine', 'feline', 'equine', 'bovine', 'deer', 'fox', 'wolf', 'bear',
  'monkey', 'ape', 'elephant', 'tiger', 'lion', 'leopard', 'zebra', 'giraffe',
  'rabbit', 'rodent', 'dog', 'cat', 'cow', 'goat', 'sheep', 'horse', 'pig',
  'duck', 'eagle', 'owl', 'sparrow', 'penguin', 'parrot', 'snake', 'lizard',
  'crocodile', 'turtle', 'frog', 'toad', 'shark', 'whale', 'dolphin', 'octopus',
  'butterfly', 'spider', 'bee', 'ibex', 'capra ibex', 'snow leopard',
  'panthera uncia', 'ounce', 'panthera pardus', 'cheetah', 'chetah',
  'acinonyx jubatus', 'jaguar', 'rocky mountain sheep', 'ram', 'tup',
  'bighorn', 'cimarron',
];

const NON_ANIMAL_LABEL_HINTS = [
  'person', 'human', 'man', 'woman', 'boy', 'girl', 'face', 'selfie',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle', 'airplane',
  'building', 'house', 'bridge', 'road', 'street', 'city', 'room', 'furniture',
  'phone', 'laptop', 'computer', 'bottle', 'cup', 'table', 'chair', 'food',
];

const normalizeLabelText = (value = '') =>
  String(value).toLowerCase().replace(/[_-]+/g, ' ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const tokenize = (value = '') => normalizeLabelText(value).split(' ').filter(Boolean);

const normalizedAnimalHints    = ANIMAL_LABEL_HINTS.map(normalizeLabelText);
const normalizedNonAnimalHints = NON_ANIMAL_LABEL_HINTS.map(normalizeLabelText);

const isLikelyAnimalLabel = (label = '') => {
  const normalizedLabel = normalizeLabelText(label);
  if (!normalizedLabel) return false;
  const labelWords = tokenize(normalizedLabel);

  const hasNonAnimalHint = normalizedNonAnimalHints.some((hint) => {
    if (!hint) return false;
    return normalizedLabel.includes(hint) || labelWords.includes(hint);
  });
  if (hasNonAnimalHint) return false;

  return normalizedAnimalHints.some((hint) => {
    if (!hint) return false;
    if (normalizedLabel.includes(hint)) return true;
    return labelWords.some((word) => word === hint || word.startsWith(`${hint}s`));
  });
};

const detectAnimalInImage = async (dataUri) => {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN is missing');

  const model          = process.env.HUGGINGFACE_MODEL || 'microsoft/resnet-50';
  const scoreThreshold = Number(process.env.HF_ANIMAL_THRESHOLD || 0.2);
  const { imageData }  = extractBase64(dataUri);
  const imageBuffer    = Buffer.from(imageData, 'base64');

  const inferenceUrls = [
    `https://router.huggingface.co/hf-inference/models/${model}`,
    `https://api-inference.huggingface.co/models/${model}`,
  ];

  let response;
  let lastError;

  for (const url of inferenceUrls) {
    try {
      response = await axios.post(url, imageBuffer, {
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          Accept:         'application/json',
        },
        timeout: 30000,
      });
      break;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 401 || status === 403) throw error;
    }
  }

  if (!response) throw lastError || new Error('Inference request failed');

  const predictions = Array.isArray(response.data) ? response.data : [];
  const sorted = predictions
    .filter((item) => item && typeof item.label === 'string' && typeof item.score === 'number')
    .sort((a, b) => b.score - a.score);

  const topPrediction        = sorted[0] || null;
  const bestAnimalPrediction = sorted.find(
    (item) => isLikelyAnimalLabel(item.label) && item.score >= scoreThreshold
  );

  return { isAnimal: Boolean(bestAnimalPrediction), topPrediction, bestAnimalPrediction, model };
};

// ═════════════════════════════════════════════════════════════
//  ROUTES — specific routes ALWAYS before generic /:id
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// 🐾 POST /api/reports/validate-animal
// ─────────────────────────────────────────────────────────────
router.post('/validate-animal', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'Image is required' });

    const detection = await detectAnimalInImage(image);

    return res.json({
      isAnimal:      detection.isAnimal,
      model:         detection.model,
      topPrediction: detection.topPrediction,
      message: detection.isAnimal
        ? 'Animal detected. Upload is allowed.'
        : 'No animal detected. Please choose another image.',
    });
  } catch (error) {
    console.error('❌ Animal detection error:', error.response?.data || error.message);

    if (error.message?.includes('HUGGINGFACE_API_TOKEN is missing')) {
      return res.status(500).json({ message: 'Server is missing Hugging Face API token configuration' });
    }
    if (error.response?.status === 503) {
      return res.status(503).json({ message: 'Hugging Face model is loading, please retry in a few seconds' });
    }
    return res.status(500).json({
      message: 'Failed to validate image with Hugging Face',
      details: error.response?.data || error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 📥 GET /api/reports — all reports
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    console.log(`📊 Returning ${reports.length} reports`);
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 🔔 GET /api/reports/new — polling endpoint for notifications
// ─────────────────────────────────────────────────────────────
router.get('/new', async (req, res) => {
  try {
    const { since } = req.query;
    let query = { isSpam: { $ne: true }, deletedBy: null };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) query.createdAt = { $gt: sinceDate };
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id specieName healthStatus username userId createdAt location image timestamp');

    console.log(`🔔 Found ${reports.length} new reports since ${since || 'beginning'}`);
    res.json(reports);
  } catch (error) {
    console.error('❌ Notification poll error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 📢 POST /api/reports/broadcast
// ─────────────────────────────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const { reportId, specieName, username } = req.body;
    console.log(`📢 Broadcasting report: ${specieName} by ${username}`);
    res.json({ success: true, message: 'Report broadcasted successfully', reportId });
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 📥 GET /api/reports/myreports/:userId
// ─────────────────────────────────────────────────────────────
router.get('/myreports/:userId', async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user reports' });
  }
});

// ─────────────────────────────────────────────────────────────
// 📍 GET /api/reports/nearby
// ─────────────────────────────────────────────────────────────
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 15 } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: 'lat and lon required' });

    const allReports = await Report.find();

    const nearbyReports = allReports
      .filter(r => r.location?.latitude && r.location?.longitude)
      .map(r => {
        const dist = getDistanceKm(
          parseFloat(lat), parseFloat(lon),
          r.location.latitude, r.location.longitude
        );
        return { report: r, dist };
      })
      .filter(item => item.dist <= radius)
      .map(({ report, dist }) => ({
        id:                report._id,
        species:           report.specieName,
        area:              report.areaName,
        distance:          dist.toFixed(1),
        lat:               report.location.latitude,
        lon:               report.location.longitude,
        health:            report.healthStatus,
        severity:          dist < 5 ? 'critical' : dist < 10 ? 'high' : 'moderate',
        time:              timeAgo(report.createdAt),
        weatherConditions: report.weatherConditions || null,
      }));

    res.json(nearbyReports);
  } catch (error) {
    console.error('Nearby error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 🔬 PATCH /:id/researcher-status
// verified | duplicate | under_review | null
// ─────────────────────────────────────────────────────────────
router.patch('/:id/researcher-status', async (req, res) => {
  try {
    const { researcherStatus, markedBy } = req.body;

    const allowed = ['verified', 'duplicate', 'under_review', null];
    if (!allowed.includes(researcherStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowed.filter(Boolean).join(', ')} or null`,
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.researcherStatus = researcherStatus;
    report.markedBy         = researcherStatus ? (markedBy || 'Researcher') : null;
    report.markedAt         = researcherStatus ? new Date() : null;

    await report.save();

    console.log(`🔬 Report ${req.params.id} marked as "${researcherStatus}" by ${markedBy}`);
    res.json({
      message:          'Researcher status updated',
      researcherStatus: report.researcherStatus,
      markedBy:         report.markedBy,
      markedAt:         report.markedAt,
    });
  } catch (error) {
    console.error('❌ Researcher status update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 📥 GET /:id — single report
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch {
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// ─────────────────────────────────────────────────────────────
// 📤 POST / — create new report (weather + area name included)
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { location } = req.body;

    let areaName = 'Unknown Area';
    if (location?.latitude && location?.longitude) {
      areaName = await getAreaName(location.latitude, location.longitude);
    }

    console.log('📥 Incoming weatherConditions:', JSON.stringify(req.body.weatherConditions, null, 2));

    const reportData = {
      image:        req.body.image,
      specieName:   req.body.specieName,
      healthStatus: req.body.healthStatus,
      location:     req.body.location,
      timestamp:    req.body.timestamp,
      username:     req.body.username || 'Anonymous User',
      userId:       req.body.userId   || 'anonymous',
      weatherConditions: req.body.weatherConditions || {
        temperature:  null,
        feelsLike:    null,
        condition:    null,
        description:  null,
        humidity:     null,
        windSpeed:    null,
        visibility:   null,
        pressure:     null,
        capturedAt:   null,
        researchNote: null,
        behaviorHint: null,
      },
      areaName,
    };

    const report      = new Report(reportData);
    const savedReport = await report.save();

    // Fire-and-forget broadcast
    fetch(`http://localhost:${process.env.PORT || 5000}/api/reports/broadcast`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId:     savedReport._id,
        specieName:   savedReport.specieName,
        healthStatus: savedReport.healthStatus,
        userId:       savedReport.userId,
        username:     savedReport.username,
        location:     savedReport.location,
        timestamp:    savedReport.timestamp,
      }),
    }).catch(err => console.log('Broadcast trigger error:', err));

    res.status(201).json(savedReport);
  } catch (error) {
    console.error('❌ POST error:', error);
    res.status(400).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ❌ DELETE /:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// 💬 POST /:id/comment
// ─────────────────────────────────────────────────────────────
router.post('/:id/comment', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.comments = [req.body, ...(report.comments || [])];
    await report.save();
    res.json({ message: 'Comment added' });
  } catch {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// ─────────────────────────────────────────────────────────────
// 📌 POST /:id/pin
// ─────────────────────────────────────────────────────────────
router.post('/:id/pin', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.pinnedComment = req.body.comment;
    await report.save();
    res.json({ message: 'Comment pinned', pinnedComment: report.pinnedComment });
  } catch {
    res.status(500).json({ message: 'Pin failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// ❌ POST /:id/unpin
// ─────────────────────────────────────────────────────────────
router.post('/:id/unpin', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.pinnedComment = null;
    await report.save();
    res.json({ message: 'Comment unpinned' });
  } catch {
    res.status(500).json({ message: 'Unpin failed' });
  }
});

module.exports = router;
