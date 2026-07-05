// src/controllers/productController.js

const Product = require('../models/Product');

/**
 * @desc    Create a new product variation
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res) => {
  try {
    const { name, sku, mrp, sellingPrice, taxRate, isTaxInclusive, barcode, minimumOrderQuantity, batchNumber, rawMaterials, billOfMaterialsCost } = req.body;

    if (!name || !sku || !mrp) {
      return res.status(400).json({ success: false, error: 'Please provide product name, SKU, and MRP' });
    }

    const product = await Product.create({
      name,
      sku,
      mrp,
      sellingPrice: sellingPrice || mrp,
      taxRate: taxRate || 18,
      isTaxInclusive: isTaxInclusive !== false,
      barcode,
      minimumOrderQuantity: minimumOrderQuantity || 1,
      batchNumber,
      rawMaterials: rawMaterials || [],
      billOfMaterialsCost: billOfMaterialsCost || 0,
      averageCostPrice: billOfMaterialsCost || Number((mrp * 0.7).toFixed(2)) // fallback cost estimate
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ success: false, error: error.code === 11000 ? 'Product SKU already exists' : 'Server error creating product record' });
  }
};

/**
 * @desc    Get all products catalog
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving products list' });
  }
};

module.exports = {
  createProduct,
  getProducts,
};
