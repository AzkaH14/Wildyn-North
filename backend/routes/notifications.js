/**
 * routes/notifications.js
 *
 * Push token management + latest notifications polling endpoint.
 *
 * Endpoints:
 *   POST /api/notifications/register-token  — device token save karo
 *   POST /api/notifications/remove-token    — logout pe token hata do
 *   GET  /api/notifications/latest          — polling fallback (10-sec poll)
 *
 * FILE LOCATION:  backend/routes/notifications.js
 */

const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const Researcher = require('../models/Researcher');
const Report     = require('../models/Report');

// ─────────────────────────────────────────────────────────────
// 📲 POST /api/notifications/register-token
//    App start pe call hota hai — device ka Expo push token save karo
//
//    Body: { userId, userType, pushToken }
//    userType: 'user' | 'researcher'
// ─────────────────────────────────────────────────────────────
router.post('/register-token', async (req, res) => {
  const { userId, userType, pushToken } = req.body;

  if (!userId || !pushToken) {
    return res.status(400).json({ message: 'userId and pushToken required' });
  }

  if (!pushToken.startsWith('ExponentPushToken[')) {
    return res.status(400).json({ message: 'Invalid Expo push token format' });
  }

  try {
    const update = {
      pushToken,
      pushTokenUpdatedAt: new Date(),
    };

    let updated;
    if (userType === 'researcher') {
      updated = await Researcher.findByIdAndUpdate(userId, update, { new: true });
    } else {
      updated = await User.findByIdAndUpdate(userId, update, { new: true });
    }

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ Push token registered for ${userType} ${userId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ register-token error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 🗑️  POST /api/notifications/remove-token
//    Logout pe call karo — token null kar do
//
//    Body: { userId, userType }
// ─────────────────────────────────────────────────────────────
router.post('/remove-token', async (req, res) => {
  const { userId, userType } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });

  try {
    const update = { pushToken: null, pushTokenUpdatedAt: null };
    if (userType === 'researcher') {
      await Researcher.findByIdAndUpdate(userId, update);
    } else {
      await User.findByIdAndUpdate(userId, update);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 📥 GET /api/notifications/latest
//    Polling fallback — recent reports jo `since` ke baad aaye
//    Frontend GlobalNotificationContext yeh call karta hai (har 10 sec)
//
//    Query: ?since=ISO_STRING&userId=CURRENT_USER_ID
// ─────────────────────────────────────────────────────────────
router.get('/latest', async (req, res) => {
  try {
    const { since, userId } = req.query;

    const query = {
      isSpam  : { $ne: true },
      deletedBy: null,
    };

    if (since) {
      const d = new Date(since);
      if (!isNaN(d.getTime())) query.createdAt = { $gt: d };
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id specieName healthStatus username userId createdAt location');

    // Filter out current user's own reports on server side too
    const filtered = userId
      ? reports.filter(r => String(r.userId) !== String(userId))
      : reports;

    res.json(filtered);
  } catch (err) {
    console.error('❌ notifications/latest error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
