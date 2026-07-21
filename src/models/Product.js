// src/models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '0000',
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      min: 0,
    },
    averageCostPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    taxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax',
      default: null,
    },
    isTaxInclusive: {
      type: Boolean,
      default: true,
    },
    tallyGuid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // --- POLYMORPHIC BUSINESS VARIATIONS SCHEMA STRATEGY ---
    // A single MongoDB collection can handle polymorphic variations efficiently by utilizing 
    // Mongoose discriminators or by defining a single collection containing all fields with sparse indexes.
    // In this implementation, we define option-specific attributes on the same collection for performance,
    // where the active store setting (Retail, Wholesale, or Manufacturing) controls which fields are visible/rendered.
    barcode: {
      type: String,
      trim: true,
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    rawMaterials: [
      {
        name: String,
        quantityNeeded: Number,
        unitCost: Number,
      }
    ],
    billOfMaterialsCost: {
      type: Number,
      default: 0,
    },

    // --- STOCK / INVENTORY FIELDS ---
    // quantity: current in-hand stock count
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    // expiryDate: optional, relevant for perishable goods / pharma / FMCG
    expiryDate: {
      type: Date,
      default: null,
    },
    // lowStockThreshold: alert fires when quantity drops below this value
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    // unit: measurement unit for display (e.g. "kg", "pcs", "litre")
    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
