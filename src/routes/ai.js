// src/routes/ai.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Forward invoice payload to Python FastAPI Microservice for GST compliance auditing
 * @route   POST /api/ai/audit/invoice
 * @access  Private
 */
router.post('/audit/invoice', protect, async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/api/ai/audit/invoice`, req.body);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Compliance Audit proxy error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'AI Compliance Audit Service is offline or unreachable'
    });
  }
});

/**
 * @desc    Fetch cashflow projection forecast from Python microservice
 * @route   GET /api/ai/forecast/cashflow
 * @access  Private
 */
router.get('/forecast/cashflow', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ai/forecast/cashflow`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Cashflow Forecast proxy error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'AI Cashflow Forecast Service is offline or unreachable'
    });
  }
});

/**
 * @desc    Fetch customer CLV & Churn risk predictions from Python microservice
 * @route   GET /api/ai/customers/clv-predictions
 * @access  Private
 */
router.get('/customers/clv-predictions', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ai/customers/clv-predictions`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Customer CLV proxy error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'AI Customer CLV Service is offline or unreachable'
    });
  }
});

/**
 * @desc    Fetch stock reorder & safety level warnings from Python microservice
 * @route   GET /api/ai/inventory/reorder-warnings
 * @access  Private
 */
router.get('/inventory/reorder-warnings', protect, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ai/inventory/reorder-warnings`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Inventory Reorder proxy error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({
      success: false,
      error: 'AI Inventory Reorder Service is offline or unreachable'
    });
  }
});

module.exports = router;
