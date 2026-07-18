const express = require('express');
const router = express.Router();
const { createPayment, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(createPayment).get(getPayments);

module.exports = router;
