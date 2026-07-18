// src/routes/invoice.js

const express = require('express');
const router = express.Router();
const { createInvoice, getInvoice, getInvoices, getUpcomingInvoiceNumber, sendInvoiceEmail, getProfitAnalytics } = require('../controllers/saleController');
const { printInvoice } = require('../controllers/pdfController');
const { protect, admin } = require('../middleware/auth');

// Print route is EXEMPT from router.use(protect) because it uses ?token= query param
// and handles its own auth via the protect middleware directly on the route
router.get('/:id/print', protect, printInvoice);

// Apply protection to all other invoice routes
router.use(protect);

// Define specific routes BEFORE parameterized routes
router.get('/next-number', getUpcomingInvoiceNumber);
router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/analytics/profit', admin, getProfitAnalytics);
router.get('/:id', getInvoice);

router.post('/:id/send-email', sendInvoiceEmail);

module.exports = router;
