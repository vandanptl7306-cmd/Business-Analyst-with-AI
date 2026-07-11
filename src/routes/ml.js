// src/routes/ml.js

const express = require('express');
const router = express.Router();
const { getDemandForecast, getDashboardMetrics, getTrendChart } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

// Protect ML analytics paths
router.use(protect);

router.get('/forecast/:productId', getDemandForecast);
router.get('/analytics/dashboard-metrics', getDashboardMetrics);
router.get('/analytics/trend-chart', getTrendChart);

module.exports = router;
// 
