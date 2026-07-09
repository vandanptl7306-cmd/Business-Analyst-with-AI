// src/routes/auth.js

const express = require('express');
const router = express.Router();
const { register, login, googleLogin, updateProfile, changePassword } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
