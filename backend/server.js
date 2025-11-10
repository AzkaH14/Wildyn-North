const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

<<<<<<< HEAD
// Disable Express's default error handler HTML responses
app.set('x-powered-by', false);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Force JSON responses - prevent HTML error pages
app.use((req, res, next) => {
  // Set default Content-Type to JSON for API routes
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});
=======
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'wildlife-app', // Explicitly set database name
})
<<<<<<< HEAD
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Connection string:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Debug middleware - log all incoming requests (BEFORE routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    console.log(`📥 Incoming request: ${req.method} ${req.path}`);
    console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`   Base URL: ${req.baseUrl || 'none'}`);
  }
  next();
});

// Routes
try {
  const reportsRoutes = require('./routes/reports');
  const wildlifeRoutes = require('./routes/wildlife');
  const authRoutes = require('./routes/auth');
  const Report = require('./models/Report');

  app.use('/api/reports', reportsRoutes);
  app.use('/api/wildlife', wildlifeRoutes);
  app.use('/api/auth', authRoutes);
  
  console.log('✅ Routes registered successfully');
  console.log('   - /api/auth/signup');
  console.log('   - /api/auth/researcher/signup');
  console.log('   - /api/auth/login');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Wildlife Reporting API is running!' });
});
=======
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
const reportsRoutes = require('./routes/reports');
const wildlifeRoutes = require('./routes/wildlife');
const authRoutes = require('./routes/auth');
const Report = require('./models/Report');

app.use('/api/reports', reportsRoutes);
app.use('/api/wildlife', wildlifeRoutes);
app.use('/api/auth', authRoutes);
>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20

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

<<<<<<< HEAD
// Error handling middleware - must be after routes
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error in middleware:', err);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);
  
  // Ensure we always return JSON, never HTML
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      path: req.path,
      method: req.method,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler - must be last (after all routes)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Available routes: /api/auth/signup, /api/auth/researcher/signup, /api/auth/login`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    availableRoutes: ['/api/auth/signup', '/api/auth/researcher/signup', '/api/auth/login']
  });
=======
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Wildlife Reporting API is running!' });
>>>>>>> 2aecc29701bd4bbd03110a40e34f584b694f1f20
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,'0.0.0.0',() => {
  console.log(`🚀 Server running on port ${PORT}`);
});
