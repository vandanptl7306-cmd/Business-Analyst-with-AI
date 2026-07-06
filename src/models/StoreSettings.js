// src/models/StoreSettings.js

const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
      default: 'IntellectBill AI Operations'
    },
    address: {
      type: String,
      required: true,
      trim: true,
      default: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana'
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '+919876543210'
    },
    email: {
      type: String,
      trim: true,
      default: 'billing@intellectbill.ai'
    },
    gstin: {
      type: String,
      trim: true,
      default: '27AAAAA1111A1Z1'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    defaultInvoiceTemplate: {
      type: String,
      enum: ['Standard', 'Modern', 'Thermal', 'TaxInvoice', 'Minimalist', 'Commercial'],
      default: 'Standard',
    },
    invoiceThemeColor: {
      type: String,
      default: '#2563eb', // default blue
    },
    businessType: {
      type: String,
      enum: ['Retail', 'Wholesale', 'Manufacturing'],
      default: 'Retail',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
