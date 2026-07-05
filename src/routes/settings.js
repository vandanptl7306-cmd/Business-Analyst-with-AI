// src/routes/settings.js

const express = require('express');
const router = express.Router();
const { getStoreSettings, updateStoreSettings, updateBusinessProfile } = require('../controllers/storeSettingsController');
const { protect } = require('../middleware/auth');

// Secure settings paths under protect middleware
router.use(protect);

router.get('/', getStoreSettings);
router.put('/', updateStoreSettings);
router.put('/profile', updateBusinessProfile);

module.exports = router;
// 
