
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// POST /api/auth/signup - Create new user
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username already taken' 
          : 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password, // In production, hash this with bcrypt
    });

    const savedUser = await user.save();

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
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
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

    // Create reset URL
    // For mobile app, you might want to use a deep link or a web page
    const resetUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
      : `http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

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

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
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

    // Update password (in production, hash with bcrypt)
    user.password = newPassword;
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
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password.trim(); // In production, hash with bcrypt
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

module.exports = router;
