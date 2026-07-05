// src/routes/auth.js

const express = require('express');
const router = express.Router();
const { register, login, googleLogin } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Example protected route to fetch current user's profile
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
