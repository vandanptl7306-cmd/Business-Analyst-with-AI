const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { createPurchase, getPurchases } = require('../controllers/purchaseController');

router.post('/', protect, createPurchase);
router.get('/', protect, getPurchases);

module.exports = router;
