const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(createCustomer).get(getCustomers);
router.route('/:id').get(getCustomer);

module.exports = router;
