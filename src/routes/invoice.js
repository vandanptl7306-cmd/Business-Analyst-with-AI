// src/routes/invoice.js

const express = require('express');
const router = express.Router();
const { createInvoice, generateComplianceData, getInvoice, getInvoices, getUpcomingInvoiceNumber, updateInvoiceStatus, sendInvoiceWhatsApp, getProfitAnalytics } = require('../controllers/invoiceController');
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
router.post('/:id/compliance', generateComplianceData);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/send-whatsapp', sendInvoiceWhatsApp);

module.exports = router;
