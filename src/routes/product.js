// src/routes/product.js

const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getLowStockProducts,
  updateProduct,
  deleteProduct,
  deductStock,
} = require('../controllers/productController');
const { validateProductProfile } = require('../middleware/profileValidation');
const { protect } = require('../middleware/auth');

// Apply JWT protection to all product routes
router.use(protect);

// Stock catalog CRUD
router.get('/', getProducts);
router.post('/', validateProductProfile, createProduct);
router.get('/low-stock', getLowStockProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Stock adjustment
router.post('/:id/deduct', deductStock);

module.exports = router;
