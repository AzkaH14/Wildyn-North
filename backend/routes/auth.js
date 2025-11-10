const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Researcher = require('../models/Researcher');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// POST /api/auth/signup - Create new user
router.post('/signup', async (req, res) => {
  // Ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }

    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Username validation
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (trimmedUsername.length > 20) {
      return res.status(400).json({ message: 'Username must not exceed 20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Email validation
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 50) {
      return res.status(400).json({ message: 'Password must not exceed 50 characters' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
    }

    // Check if username already exists in BOTH User and Researcher collections
    const existingUser = await User.findOne({ username: trimmedUsername });
    const existingResearcher = await Researcher.findOne({ username: trimmedUsername });

    if (existingUser || existingResearcher) {
      return res.status(400).json({ 
        message: 'Username already taken. Please choose a different username.' 
      });
    }

    // Check if email already exists in BOTH User and Researcher collections
    const existingUserEmail = await User.findOne({ email: trimmedEmail });
    const existingResearcherEmail = await Researcher.findOne({ email: trimmedEmail });

    if (existingUserEmail || existingResearcherEmail) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use a different email or try logging in.' 
      });
    }

    // Create new user
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
    });

    console.log('Attempting to save user:', { username: trimmedUsername, email: trimmedEmail });
    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    // Return user data (excluding password)
    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'username or email';
      return res.status(400).json({ 
        message: `${duplicateField} already exists. Please choose a different ${duplicateField}.` 
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(err => err.message).join(', ');
      return res.status(400).json({ 
        message: `Validation error: ${validationErrors}` 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login - Login user (checks both User and Researcher)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Try to find in User collection first
    let user = await User.findOne({ username });
    let userType = 'community';

    // If not found, check Researcher collection
    if (!user) {
      user = await Researcher.findOne({ username });
      userType = 'researcher';
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Backward compatibility: support plaintext passwords stored previously
    const isHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    let passwordValid = false;
    if (isHashed) {
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plaintext comparison fallback
      passwordValid = user.password === password;
      // If valid, migrate to hashed password
      if (passwordValid) {
        try {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          await user.save();
        } catch (migrateErr) {
          console.warn('Password hash migration failed for user:', user._id, migrateErr?.message);
        }
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: userType,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Configure email transporter
const createTransporter = () => {
  // Use environment variables or default to Gmail SMTP
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };

  // If no email credentials are set, return null (will use console.log fallback)
  if (!emailUser || !emailPass) {
    console.warn('⚠️  Email credentials not configured.');
    console.warn('   SMTP_USER:', emailUser ? '✅ Set' : '❌ Missing');
    console.warn('   SMTP_PASS:', emailPass ? '✅ Set' : '❌ Missing');
    console.warn('   Password reset emails will be logged to console instead.');
    return null;
  }

  console.log('📧 Email transporter configured:');
  console.log('   Host:', emailConfig.host);
  console.log('   Port:', emailConfig.port);
  console.log('   User:', emailConfig.auth.user);
  console.log('   Pass:', emailConfig.auth.pass ? '***' : 'Missing');

  return nodemailer.createTransport(emailConfig);
};

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // For security, don't reveal if email exists or not
      // Return success message regardless
      return res.json({
        message: 'If the email exists, password reset instructions have been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(resetTokenExpiry);
    await user.save();

    // 🔥 UPDATED: Use ngrok URL from environment or default
    // Set NGROK_URL in your .env file after starting ngrok
    const baseUrl = process.env.NGROK_URL || process.env.FRONTEND_URL || 'http://192.168.10.181:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send email
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@wildlifeapp.com',
      to: user.email,
      subject: 'Password Reset Request - Wildlife App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #F4D03F; color: #000; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; font-weight: 600; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${user.username},
        
        You requested to reset your password. Use the following link to reset it:
        
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request this, please ignore this email.
      `,
    };

    if (transporter) {
      try {
        console.log(`📤 Attempting to send password reset email to ${user.email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent successfully!`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log(`   Reset URL: ${resetUrl}`);
      } catch (emailError) {
        console.error('❌ Error sending email:');
        console.error('   Message:', emailError.message);
        console.error('   Code:', emailError.code);
        if (emailError.response) {
          console.error('   Server Response:', emailError.response);
        }
        console.error('   Full error:', JSON.stringify(emailError, null, 2));
        // Still return success for security (don't reveal if email failed)
      }
    } else {
      // Fallback: log the reset link to console for development
      console.log('\n📧 ===== PASSWORD RESET EMAIL (NOT CONFIGURED) =====');
      console.log('⚠️  To enable email sending, add SMTP credentials to your .env file:');
      console.log('   SMTP_USER=your-email@gmail.com');
      console.log('   SMTP_PASS=your-app-password');
      console.log('\n📨 Email details (for manual testing):');
      console.log(`   To: ${user.email}`);
      console.log(`   Reset Link: ${resetUrl}`);
      console.log('==================================================\n');
    }

    res.json({
      message: 'If the email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token and new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validation
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Please provide email and new password' });
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (newPassword.length > 50) {
      return res.status(400).json({ message: 'Password must not exceed 50 characters' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
    }

    // Find user by email and token
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      resetToken: token,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if token has expired
    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      // Clear expired token
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Update password (hash with bcrypt)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// GET /api/auth/profile/:userId - Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data (excluding password)
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// PUT /api/auth/profile/:userId - Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, password } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update username if provided
    if (username && username.trim()) {
      // Check if new username is already taken by another user
      const existingUser = await User.findOne({ 
        username: username.trim(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      user.username = username.trim();
    }

    // Update email if provided
    if (email && email.trim()) {
      // Check if new email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.trim().toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      user.email = email.trim().toLowerCase();
    }

    // Update password if provided
    if (password && password.trim()) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      if (password.length > 50) {
        return res.status(400).json({ message: 'Password must not exceed 50 characters' });
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    // Return updated user data (excluding password)
    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// GET /api/auth/test-email - Test email configuration (for debugging)
router.get('/test-email', async (req, res) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return res.status(400).json({ 
        message: 'Email not configured',
        details: {
          SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || 'Not set',
          SMTP_PASS: (process.env.SMTP_PASS || process.env.EMAIL_PASS) ? 'Set (hidden)' : 'Not set',
          SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
          SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
        }
      });
    }

    // Test email to the configured user
    const testEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || testEmail,
      to: testEmail,
      subject: 'Test Email - Wildlife App',
      text: 'This is a test email. If you receive this, your email configuration is working!',
      html: '<p>This is a test email. If you receive this, your email configuration is working!</p>'
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      res.json({ 
        success: true,
        message: 'Test email sent successfully!',
        messageId: info.messageId,
        response: info.response,
        to: testEmail
      });
    } catch (emailError) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: emailError.message,
        code: emailError.code,
        details: emailError.response || emailError
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Server error during test email', error: error.message });
  }
});

// ===== RESEARCHER ROUTES =====

// Test route to verify researcher routes are accessible
router.get('/researcher/test', (req, res) => {
  res.json({ message: 'Researcher routes are working!', path: req.path });
});

// POST /api/auth/researcher/signup - Create new researcher
router.post('/researcher/signup', async (req, res) => {
  // Ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('=== Researcher signup endpoint hit ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }

    const { username, email, password, education } = req.body;
    console.log('Parsed data:', { username, email, hasPassword: !!password, hasEducation: !!education });

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (!education) {
      return res.status(400).json({ message: 'Education details are required for researchers' });
    }

    // Username validation
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (trimmedUsername.length > 20) {
      return res.status(400).json({ message: 'Username must not exceed 20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }

    // Email validation
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 50) {
      return res.status(400).json({ message: 'Password must not exceed 50 characters' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
    }

    // Education validation
    const { highestDegree, fieldOfStudy, institution, graduationYear, specialization } = education;
    if (!highestDegree || !fieldOfStudy || !institution || !graduationYear || !specialization) {
      return res.status(400).json({ message: 'All education fields are required' });
    }

    // Check if username already exists in either User or Researcher collection
    const existingUser = await User.findOne({ username: trimmedUsername });
    const existingResearcher = await Researcher.findOne({ username: trimmedUsername });

    if (existingUser || existingResearcher) {
      return res.status(400).json({ 
        message: 'Username already taken. Please choose a different username.' 
      });
    }

    // Check if email already exists in either collection
    const existingUserEmail = await User.findOne({ email: trimmedEmail });
    const existingResearcherEmail = await Researcher.findOne({ email: trimmedEmail });

    if (existingUserEmail || existingResearcherEmail) {
      return res.status(400).json({ 
        message: 'Email already registered. Please use a different email or try logging in.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new researcher
    const researcher = new Researcher({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      education: {
        highestDegree: education.highestDegree.trim(),
        fieldOfStudy: education.fieldOfStudy.trim(),
        institution: education.institution.trim(),
        graduationYear: education.graduationYear.trim(),
        specialization: education.specialization.trim(),
        certifications: education.certifications ? education.certifications.trim() : '',
      },
    });

    console.log('Attempting to save researcher:', { username: trimmedUsername, email: trimmedEmail });
    const savedResearcher = await researcher.save();
    console.log('Researcher saved successfully:', savedResearcher._id);

    // Return researcher data (excluding password)
    res.status(201).json({
      message: 'Researcher account created successfully',
      user: {
        _id: savedResearcher._id,
        username: savedResearcher.username,
        email: savedResearcher.email,
        userType: 'researcher',
        education: savedResearcher.education,
      },
    });
  } catch (error) {
    console.error('❌ Researcher signup error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      stack: error.stack
    });
    
    // Ensure we always return JSON, never HTML
    if (!res.headersSent) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern || {})[0] || 'username or email';
        return res.status(400).json({ 
          message: `${duplicateField} already exists. Please choose a different ${duplicateField}.` 
        });
      }
      
      // Check if it's a validation error
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors || {}).map(err => err.message).join(', ');
        return res.status(400).json({ 
          message: `Validation error: ${validationErrors}` 
        });
      }
      
      return res.status(500).json({ 
        message: 'Server error during researcher signup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// GET /api/auth/researcher/profile/:researcherId - Get researcher profile
router.get('/researcher/profile/:researcherId', async (req, res) => {
  try {
    const { researcherId } = req.params;

    if (!researcherId) {
      return res.status(400).json({ message: 'Researcher ID is required' });
    }

    const researcher = await Researcher.findById(researcherId);

    if (!researcher) {
      return res.status(404).json({ message: 'Researcher not found' });
    }

    res.json({
      user: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        userType: 'researcher',
      },
    });
  } catch (error) {
    console.error('Get researcher profile error:', error);
    res.status(500).json({ message: 'Server error while fetching researcher profile' });
  }
});

// PUT /api/auth/researcher/profile/:researcherId - Update researcher profile
router.put('/researcher/profile/:researcherId', async (req, res) => {
  try {
    const { researcherId } = req.params;
    const { username, email, password } = req.body;

    if (!researcherId) {
      return res.status(400).json({ message: 'Researcher ID is required' });
    }

    const researcher = await Researcher.findById(researcherId);

    if (!researcher) {
      return res.status(404).json({ message: 'Researcher not found' });
    }

    // Update username if provided (ensure uniqueness across both collections)
    if (username && username.trim()) {
      const trimmed = username.trim();
      const existingInUsers = await User.findOne({ username: trimmed, _id: { $ne: researcherId } });
      const existingInResearchers = await Researcher.findOne({ username: trimmed, _id: { $ne: researcherId } });
      if (existingInUsers || existingInResearchers) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      researcher.username = trimmed;
    }

    // Update email if provided (ensure uniqueness across both collections)
    if (email && email.trim()) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingInUsers = await User.findOne({ email: trimmedEmail, _id: { $ne: researcherId } });
      const existingInResearchers = await Researcher.findOne({ email: trimmedEmail, _id: { $ne: researcherId } });
      if (existingInUsers || existingInResearchers) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      researcher.email = trimmedEmail;
    }

    // Update password if provided (same validation as user)
    if (password && password.trim()) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      if (password.length > 50) {
        return res.status(400).json({ message: 'Password must not exceed 50 characters' });
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)' });
      }
      const salt = await bcrypt.genSalt(10);
      researcher.password = await bcrypt.hash(password.trim(), salt);
    }

    await researcher.save();

    res.json({
      message: 'Researcher profile updated successfully',
      user: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        userType: 'researcher',
      },
    });
  } catch (error) {
    console.error('Update researcher profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Server error while updating researcher profile' });
  }
});

module.exports = router;