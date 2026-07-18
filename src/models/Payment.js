// src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Cheque', 'Other'], default: 'Cash' },
    referenceNumber: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
