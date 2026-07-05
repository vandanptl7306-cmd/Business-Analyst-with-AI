// src/routes/party.js

const express = require('express');
const router = express.Router();
const { createParty, getParties, getParty, sendPaymentReminder } = require('../controllers/partyController');
const { protect } = require('../middleware/auth');

// Secure all customer/party ledger routes
router.use(protect);

router.post('/', createParty);
router.get('/', getParties);
router.get('/:id', getParty);
router.post('/:id/send-reminder', sendPaymentReminder);

module.exports = router;
// 
