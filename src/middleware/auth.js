// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware to secure routes and verify JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token or check query parameters
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development_only');

      // Get user from the token payload and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

/**
 * Admin middleware to restrict access to Admins only
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Access forbidden. Admin authorization required.' });
  }
};

module.exports = { protect, admin };
