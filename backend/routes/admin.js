const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Researcher = require('../models/Researcher');
const Report = require('../models/Report');
const User = require('../models/User');

const { sendEmail } = require('../utils/email');

// ===== ADMIN AUTHENTICATION =====

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Admin login successful',
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    const normalizedUsername = String(username).trim();
    const normalizedEmail    = String(email).trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        message: 'Admin profile updated (offline mode)',
        admin: { _id: id, username: normalizedUsername, email: normalizedEmail, role: 'admin' },
        persisted: false,
      });
    }

    const existingUsername = await Admin.findOne({ username: normalizedUsername, _id: { $ne: id } });
    if (existingUsername) return res.status(409).json({ message: 'Username already in use' });

    const existingEmail = await Admin.findOne({ email: normalizedEmail, _id: { $ne: id } });
    if (existingEmail) return res.status(409).json({ message: 'Email already in use' });

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { username: normalizedUsername, email: normalizedEmail },
      { new: true, runValidators: true }
    );

    if (!updatedAdmin) return res.status(404).json({ message: 'Admin not found' });

    res.json({
      message: 'Admin profile updated successfully',
      admin: {
        _id: updatedAdmin._id,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    if (error?.name === 'MongooseError' || String(error?.message || '').includes('buffering timed out')) {
      return res.json({
        message: 'Admin profile updated (offline mode)',
        admin: {
          _id: req.params.id,
          username: String(req.body?.username || '').trim(),
          email: String(req.body?.email || '').trim().toLowerCase(),
          role: 'admin',
        },
        persisted: false,
      });
    }
    res.status(500).json({ message: 'Failed to update admin profile' });
  }
});

// ===== RESEARCHER VERIFICATION =====

router.get('/researchers/pending', async (req, res) => {
  try {
    const pendingResearchers = await Researcher.find({ verified: false }).sort({ createdAt: -1 });
    res.json({
      count: pendingResearchers.length,
      researchers: pendingResearchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        orcid: r.orcid,
        education: r.education,
        createdAt: r.createdAt,
        verified: r.verified,
      })),
    });
  } catch (error) {
    console.error('Error fetching pending researchers:', error);
    res.status(500).json({ message: 'Failed to fetch pending researchers' });
  }
});

router.get('/researchers/all', async (req, res) => {
  try {
    const allResearchers = await Researcher.find().sort({ createdAt: -1 });
    res.json({
      count: allResearchers.length,
      researchers: allResearchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        orcid: r.orcid,
        education: r.education,
        verified: r.verified,
        verifiedAt: r.verifiedAt,
        verifiedBy: r.verifiedBy,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching all researchers:', error);
    res.status(500).json({ message: 'Failed to fetch researchers' });
  }
});

router.post('/researchers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });

    const researcher = await Researcher.findById(id);
    if (!researcher) return res.status(404).json({ message: 'Researcher not found' });
    if (researcher.verified) return res.status(400).json({ message: 'Researcher is already verified' });

    const { isValidOrcid } = require('../utils/orcid');
    if (!isValidOrcid(researcher.orcid)) {
      return res.status(400).json({ message: 'Cannot verify researcher: invalid ORCID' });
    }

    researcher.verified        = true;
    researcher.verifiedAt      = new Date();
    researcher.verifiedBy      = adminUsername;
    researcher.rejectionReason = null;
    await researcher.save();

    try {
      const subject = 'Your researcher account has been approved';
      const html = `
        <p>Hello <strong>${researcher.username}</strong>,</p>
        <p>Good news! Your researcher account has been reviewed and <strong>approved</strong> by an administrator.</p>
        <p>You can now <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">log in</a> to the application and access the researcher home screen.</p>
        <p>Thank you for registering with the Wildlife App.</p>
      `;
      const text = `Hello ${researcher.username},\n\nYour researcher account has been approved. Log in: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
      await sendEmail(researcher.email, subject, html, text);
    } catch (emailErr) {
      console.error('Error sending verification email:', emailErr);
    }

    res.json({
      message: 'Researcher verified successfully',
      researcher: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        orcid: researcher.orcid,
        verified: researcher.verified,
        verifiedAt: researcher.verifiedAt,
        verifiedBy: researcher.verifiedBy,
      },
    });
  } catch (error) {
    console.error('Error verifying researcher:', error);
    res.status(500).json({ message: 'Failed to verify researcher' });
  }
});

router.post('/researchers/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, rejectionReason } = req.body;

    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const researcher = await Researcher.findById(id);
    if (!researcher) return res.status(404).json({ message: 'Researcher not found' });

    researcher.verified        = false;
    researcher.rejectionReason = rejectionReason.trim();
    researcher.verifiedBy      = adminUsername;
    researcher.verifiedAt      = new Date();
    await researcher.save();

    try {
      const subject = 'Researcher account verification rejected';
      const html = `
        <p>Hello <strong>${researcher.username}</strong>,</p>
        <p>Unfortunately, your researcher account verification has been <strong>rejected</strong>.</p>
        <p>Reason: <blockquote>${rejectionReason.trim()}</blockquote></p>
        <p>Please review your information and resubmit.</p>
      `;
      const text = `Hello ${researcher.username},\n\nYour account was rejected.\nReason: ${rejectionReason.trim()}`;
      await sendEmail(researcher.email, subject, html, text);
    } catch (emailErr) {
      console.error('Error sending rejection email:', emailErr);
    }

    res.json({
      message: 'Researcher rejected',
      researcher: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        verified: researcher.verified,
        rejectionReason: researcher.rejectionReason,
        verifiedBy: researcher.verifiedBy,
      },
    });
  } catch (error) {
    console.error('Error rejecting researcher:', error);
    res.status(500).json({ message: 'Failed to reject researcher' });
  }
});

// ===== REPORT MANAGEMENT =====

router.get('/reports/all', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({
      count: reports.length,
      reports: reports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        username: r.username,
        userId: r.userId,
        image: r.image,
        isSpam: r.isSpam || false,
        isInappropriate: r.isInappropriate || false,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        deletedBy: r.deletedBy,
        deletedAt: r.deletedAt,
        createdAt: r.createdAt,
        commentsCount: r.comments ? r.comments.length : 0,
        weatherConditions: r.weatherConditions || null,
        researcherStatus: r.researcherStatus || null,
        markedBy: r.markedBy || null,
        markedAt: r.markedAt || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.get('/reports/flagged', async (req, res) => {
  try {
    const flaggedReports = await Report.find({
      $or: [{ isSpam: true }, { isInappropriate: true }],
    }).sort({ flaggedAt: -1 });

    res.json({
      count: flaggedReports.length,
      reports: flaggedReports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        username: r.username,
        userId: r.userId,
        image: r.image,
        isSpam: r.isSpam,
        isInappropriate: r.isInappropriate,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        createdAt: r.createdAt,
        weatherConditions: r.weatherConditions || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching flagged reports:', error);
    res.status(500).json({ message: 'Failed to fetch flagged reports' });
  }
});

router.post('/reports/:id/flag-spam', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;
    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.isSpam    = true;
    report.flaggedBy = adminUsername;
    report.flaggedAt = new Date();
    await report.save();

    res.json({
      message: 'Report marked as spam',
      report: { _id: report._id, specieName: report.specieName, isSpam: report.isSpam, flaggedBy: report.flaggedBy, flaggedAt: report.flaggedAt },
    });
  } catch (error) {
    console.error('Error flagging report as spam:', error);
    res.status(500).json({ message: 'Failed to flag report as spam' });
  }
});

router.post('/reports/:id/flag-inappropriate', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;
    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.isInappropriate = true;
    report.flaggedBy       = adminUsername;
    report.flaggedAt       = new Date();
    await report.save();

    res.json({
      message: 'Report marked as inappropriate',
      report: { _id: report._id, specieName: report.specieName, isInappropriate: report.isInappropriate, flaggedBy: report.flaggedBy, flaggedAt: report.flaggedAt },
    });
  } catch (error) {
    console.error('Error flagging report as inappropriate:', error);
    res.status(500).json({ message: 'Failed to flag report as inappropriate' });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;
    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    await Report.findByIdAndDelete(id);

    res.json({
      message: 'Report removed successfully',
      deletedReport: { _id: report._id, specieName: report.specieName, deletedBy: adminUsername, deletedAt: new Date() },
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Unable to remove content at this time.' });
  }
});

router.post('/reports/:id/unflag', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;
    if (!adminUsername) return res.status(400).json({ message: 'Admin username is required' });

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.isSpam          = false;
    report.isInappropriate = false;
    report.flaggedBy       = null;
    report.flaggedAt       = null;
    await report.save();

    res.json({
      message: 'Report flags removed successfully',
      report: { _id: report._id, specieName: report.specieName, isSpam: report.isSpam, isInappropriate: report.isInappropriate },
    });
  } catch (error) {
    console.error('Error unflagging report:', error);
    res.status(500).json({ message: 'Failed to unflag report' });
  }
});

// ===== USER MANAGEMENT =====

router.get('/users/all', async (req, res) => {
  try {
    const [communityUsers, researchers] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Researcher.find().sort({ createdAt: -1 }),
    ]);

    const allUsers = [
      ...communityUsers.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        userType: 'community',
        createdAt: u.createdAt,
      })),
      ...researchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        userType: 'researcher',
        verified: r.verified,
        education: r.education,
        createdAt: r.createdAt,
      })),
    ];

    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ count: allUsers.length, users: allUsers });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let user     = await User.findById(id);
    let userType = 'community';

    if (!user) {
      user     = await Researcher.findById(id);
      userType = 'researcher';
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const reports = await Report.find({
      $or: [{ userId: id }, { userId: id.toString() }, { username: user.username }],
    }).sort({ createdAt: -1 });

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType,
      createdAt: user.createdAt,
      reportsCount: reports.length,
      reports: reports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        image: r.image,
        isSpam: r.isSpam || false,
        isInappropriate: r.isInappropriate || false,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        createdAt: r.createdAt,
        commentsCount: r.comments ? r.comments.length : 0,
      })),
    };

    if (userType === 'researcher') {
      userData.verified        = user.verified;
      userData.education       = user.education;
      userData.verifiedAt      = user.verifiedAt;
      userData.verifiedBy      = user.verifiedBy;
      userData.rejectionReason = user.rejectionReason;
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// ── DELETE /api/admin/users/:id ── DELETE USER + ALL THEIR REPORTS ──
router.delete('/users/:id', async (req, res) => {
  try {
    const { id }          = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    // Try community User collection first
    let user     = await User.findById(id);
    let userType = 'community';

    // If not found, check Researcher collection
    if (!user) {
      user     = await Researcher.findById(id);
      userType = 'researcher';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = user.username;

    // Delete all reports submitted by this user
    const deletedReports = await Report.deleteMany({
      $or: [
        { userId: id },
        { userId: id.toString() },
        { username: username },
      ],
    });

    // Delete the user from the appropriate collection
    if (userType === 'community') {
      await User.findByIdAndDelete(id);
    } else {
      await Researcher.findByIdAndDelete(id);
    }

    console.log(`Admin "${adminUsername}" deleted ${userType} user "${username}" and ${deletedReports.deletedCount} of their reports.`);

    res.json({
      message: `User "${username}" and their data have been permanently deleted.`,
      deletedUser: {
        _id: id,
        username,
        userType,
        deletedBy: adminUsername,
        deletedAt: new Date(),
        reportsDeleted: deletedReports.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user. Please try again.' });
  }
});

// ===== DASHBOARD STATS =====

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalReports,
      spamReports,
      inappropriateReports,
      pendingResearchers,
      verifiedResearchers,
      totalUsers,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ isSpam: true }),
      Report.countDocuments({ isInappropriate: true }),
      Researcher.countDocuments({ verified: false }),
      Researcher.countDocuments({ verified: true }),
      mongoose.model('User').countDocuments(),
    ]);

    res.json({
      reports: {
        total: totalReports,
        spam: spamReports,
        inappropriate: inappropriateReports,
        normal: totalReports - spamReports - inappropriateReports,
      },
      researchers: {
        pending: pendingResearchers,
        verified: verifiedResearchers,
        total: pendingResearchers + verifiedResearchers,
      },
      users: { total: totalUsers },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
