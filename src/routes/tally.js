// src/routes/tally.js

const express = require('express');
const router = express.Router();
const { importTallyData, exportTallyData } = require('../controllers/tallyController');
const { protect } = require('../middleware/auth');

// Apply protection middleware to Tally routes
router.use(protect);

router.post('/import', importTallyData);
router.get('/export', exportTallyData);

module.exports = router;
// 
