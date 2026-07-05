// src/routes/product.js

const express = require('express');
const router = express.Router();
const { createProduct, getProducts } = require('../controllers/productController');
const { validateProductProfile } = require('../middleware/profileValidation');
const { protect } = require('../middleware/auth');

// Apply protection to all catalog endpoints
router.use(protect);

router.post('/', validateProductProfile, createProduct);
router.get('/', getProducts);

module.exports = router;
// 
