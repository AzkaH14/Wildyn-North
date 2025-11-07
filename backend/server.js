const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'wildlife-app', // Explicitly set database name
})
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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Wildlife Reporting API is running!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,'0.0.0.0',() => {
  console.log(`🚀 Server running on port ${PORT}`);
});
