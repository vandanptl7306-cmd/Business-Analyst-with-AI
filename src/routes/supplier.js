const express = require('express');
const router = express.Router();
const { createSupplier, getSuppliers, getSupplier } = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').post(createSupplier).get(getSuppliers);
router.route('/:id').get(getSupplier);

module.exports = router;
