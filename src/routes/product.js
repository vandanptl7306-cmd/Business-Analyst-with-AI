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
const { protect } = require('../middleware/auth');

// Apply JWT protection to all product routes
router.use(protect);

// Stock catalog CRUD - define specific routes BEFORE parameterized routes
router.get('/low-stock', getLowStockProducts);
router.get('/', getProducts);
// Note: validateProductProfile is intentionally removed from the stock POST route.
// The Stock Management page is a general inventory tool — it doesn't carry
// Wholesale batch numbers or Manufacturing BOM data. Profile-specific validation
// only applies to invoice line-item product creation, not stock entries.
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Stock adjustment
router.post('/:id/deduct', deductStock);

module.exports = router;
