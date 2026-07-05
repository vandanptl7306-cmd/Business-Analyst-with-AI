// src/routes/payment.js

const express = require('express');
const router = express.Router();
const { receiveInvoicePayment, getInvoicePayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Secure payments pathways under protect middleware
router.use(protect);

router.post('/', receiveInvoicePayment);
router.get('/invoice/:invoiceId', getInvoicePayments);

module.exports = router;
// 
