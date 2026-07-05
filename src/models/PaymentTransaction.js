// src/models/PaymentTransaction.js

const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'],
      required: true,
    },
    amountReceived: {
      type: Number,
      required: true,
      min: 0.01,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    isAdvance: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
