// src/controllers/productController.js

const Product = require('../models/Product');

/**
 * @desc    Create a new product / stock entry
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res) => {
  try {
    const {
      name, sku, mrp, sellingPrice, taxId, categoryId, isTaxInclusive,
      barcode, minimumOrderQuantity, batchNumber, rawMaterials,
      billOfMaterialsCost,
      // Stock fields
      quantity, expiryDate, lowStockThreshold, unit,
    } = req.body;

    if (!name || !sku || mrp === undefined || mrp === null) {
      return res.status(400).json({ success: false, error: 'Please provide product name, SKU, and MRP' });
    }

    const product = await Product.create({
      userId: req.user._id,
      name,
      sku,
      mrp,
      sellingPrice: sellingPrice || mrp,
      taxId: taxId || null,
      categoryId: categoryId || null,
      isTaxInclusive: isTaxInclusive !== false,
      barcode,
      minimumOrderQuantity: minimumOrderQuantity || 1,
      batchNumber,
      rawMaterials: rawMaterials || [],
      billOfMaterialsCost: billOfMaterialsCost || 0,
      averageCostPrice: billOfMaterialsCost || Number((mrp * 0.7).toFixed(2)),
      // Stock
      quantity: quantity !== undefined ? Number(quantity) : 0,
      expiryDate: expiryDate || null,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
      unit: unit || 'pcs',
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({
      success: false,
      error: error.code === 11000 ? 'Product SKU already exists' : 'Server error creating product record',
    });
  }
};

/**
 * @desc    Get all products (with optional low-stock filter)
 * @route   GET /api/products
 * @access  Private
 */
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving products list' });
  }
};

/**
 * @desc    Get only low-stock or expiring-soon products
 * @route   GET /api/products/low-stock
 * @access  Private
 */
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id }).sort({ name: 1 });

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const alerts = products.filter((p) => {
      const isLow = p.quantity <= p.lowStockThreshold;
      const isExpiringSoon = p.expiryDate && new Date(p.expiryDate) <= in30Days;
      return isLow || isExpiringSoon;
    });

    res.status(200).json({ success: true, products: alerts });
  } catch (error) {
    console.error('Low-stock fetch error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching low-stock list' });
  }
};

/**
 * @desc    Update a product / restock quantity
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, sku, mrp, sellingPrice, taxId, categoryId,
      quantity, expiryDate, lowStockThreshold, unit,
      barcode, batchNumber,
    } = req.body;

    const product = await Product.findOne({ _id: id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (sku !== undefined) product.sku = sku;
    if (mrp !== undefined) product.mrp = Number(mrp);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (taxId !== undefined) product.taxId = taxId || null;
    if (categoryId !== undefined) product.categoryId = categoryId || null;
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (expiryDate !== undefined) product.expiryDate = expiryDate || null;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (unit !== undefined) product.unit = unit;
    if (barcode !== undefined) product.barcode = barcode;
    if (batchNumber !== undefined) product.batchNumber = batchNumber;

    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating product' });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Use findOne + deleteOne pattern compatible with mock DB
    const product = await Product.findOne({ _id: id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    await Product.deleteOne({ _id: id, userId: req.user._id });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ success: false, error: 'Server error deleting product' });
  }
};

/**
 * @desc    Deduct stock when a product is used in an invoice
 *          Called internally from invoice controller, OR via API for manual adjustments
 * @route   POST /api/products/:id/deduct
 * @access  Private
 */
const deductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Provide a positive quantity to deduct' });
    }

    const product = await Product.findOne({ _id: id, userId: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const newQty = Math.max(0, product.quantity - Number(quantity));
    product.quantity = newQty;
    await product.save();

    const isLow = newQty <= product.lowStockThreshold;
    res.status(200).json({
      success: true,
      product,
      lowStockAlert: isLow,
      message: isLow
        ? `Stock low: only ${newQty} ${product.unit || 'pcs'} remaining for "${product.name}"`
        : `Stock updated. ${newQty} ${product.unit || 'pcs'} remaining.`,
    });
  } catch (error) {
    console.error('Deduct stock error:', error.message);
    res.status(500).json({ success: false, error: 'Server error deducting stock' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  updateProduct,
  deleteProduct,
  deductStock,
};
