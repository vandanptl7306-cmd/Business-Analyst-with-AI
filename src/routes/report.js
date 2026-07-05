// src/routes/report.js

const express = require('express');
const router = express.Router();
const { getSalesSummary, getProfitLoss, getGSTLiability } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/auth');

// Secure all financial report analytics paths to authenticated Admins only
router.use(protect);
router.use(admin);

router.get('/sales-summary', getSalesSummary);
router.get('/profit-loss', getProfitLoss);
router.get('/gst-liability', getGSTLiability);

module.exports = router;
// 
