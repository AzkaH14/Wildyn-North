const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Disable Express's default error handler HTML responses
app.set('x-powered-by', false);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Force JSON responses - prevent HTML error pages
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'wildlife-app',
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Connection string:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Debug middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    console.log(`📥 Incoming request: ${req.method} ${req.path}`);
    console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`   Base URL: ${req.baseUrl || 'none'}`);
  }
  next();
});

// ─────────────────────────────────────────────────────────────
// 🔬 PATCH researcher-status — registered DIRECTLY here
//    so it is always found, regardless of routes/reports.js cache
// ─────────────────────────────────────────────────────────────
app.patch('/api/reports/:id/researcher-status', async (req, res) => {
  try {
    const Report = require('./models/Report');
    const { researcherStatus, markedBy } = req.body;

    console.log(`🔬 PATCH researcher-status hit: id=${req.params.id} status=${researcherStatus} by=${markedBy}`);

    const allowed = ['verified', 'duplicate', 'under_review', null];
    if (!allowed.includes(researcherStatus)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowed.filter(Boolean).join(', ')} or null`,
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.researcherStatus = researcherStatus;
    report.markedBy = researcherStatus ? (markedBy || 'Researcher') : null;
    report.markedAt = researcherStatus ? new Date() : null;
    await report.save();

    console.log(`✅ Report ${req.params.id} => researcherStatus="${researcherStatus}"`);
    res.json({
      message: 'Researcher status updated',
      researcherStatus: report.researcherStatus,
      markedBy: report.markedBy,
      markedAt: report.markedAt,
    });
  } catch (error) {
    console.error('❌ researcher-status error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Routes
let Report;
try {
  const reportsRoutes = require('./routes/reports');
  const wildlifeRoutes = require('./routes/wildlife');
  const authRoutes = require('./routes/auth');
  const adminRoutes = require('./routes/admin');
  const surveyRoutes = require('./routes/surveys');
  Report = require('./models/Report');

  app.use('/api/reports', reportsRoutes);
  app.use('/api/wildlife', wildlifeRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/surveys', surveyRoutes);

  // Notifications route
  const notificationsRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationsRoutes);

  console.log('✅ Routes registered successfully');
  console.log('   - /api/auth/signup');
  console.log('   - /api/auth/researcher/signup');
  console.log('   - /api/auth/login');
  console.log('   - /api/admin/login');
  console.log('   - /api/admin/researchers/pending');
  console.log('   - /api/admin/reports/flagged');
  console.log('   - PATCH /api/reports/:id/researcher-status ✅');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Wildlife Reporting API is running!' });
});

// GET user's own reports (alternative endpoint for ReportsHistory)
app.get('/api/myreports', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user reports' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error in middleware:', err);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);

  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      path: req.path,
      method: req.method,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler - must be last
app.use((req, res) => {
  if (req.originalUrl.startsWith('/file:///')) {
    return res.status(204).end();
  }

  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    availableRoutes: ['/api/auth/signup', '/api/auth/researcher/signup', '/api/auth/login']
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
