const express = require('express');
const router = express.Router();
const { createTax, getTaxes } = require('../controllers/taxController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(createTax).get(getTaxes);

module.exports = router;
