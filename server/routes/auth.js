const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, JWT_SECRET } = require('../middleware/auth');

// Fallback admin password hash for serverless mode
const DEFAULT_ADMIN_EMAIL = 'admin@leaddesk.com';
const DEFAULT_ADMIN_PASS = 'AdminPass123!';

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch = await user.matchPassword(password);
          if (isMatch) {
            const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({
              success: true,
              message: 'Login successful',
              token,
              user: { id: user._id, email: user.email, role: user.role },
            });
          }
        }
      } catch (dbErr) {
        console.error('Mongoose auth error, using fallback auth:', dbErr.message);
      }
    }

    // Serverless fallback admin check
    if (cleanEmail === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASS) {
      const fallbackId = '6a737000admin00000000000';
      const token = jwt.sign({ id: fallbackId, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: { id: fallbackId, email: DEFAULT_ADMIN_EMAIL, role: 'admin' },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user ? req.user._id : '6a737000admin00000000000',
      email: req.user ? req.user.email : DEFAULT_ADMIN_EMAIL,
      role: 'admin',
    },
  });
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
