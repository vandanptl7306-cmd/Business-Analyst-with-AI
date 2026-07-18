// src/controllers/paymentController.js
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const createPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber, notes, saleId, purchaseId, customerId, supplierId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
    }
    
    // Determine context
    if (!saleId && !purchaseId && !customerId && !supplierId) {
      return res.status(400).json({ success: false, error: 'Payment must be associated with a transaction or party' });
    }

    const payment = await Payment.create({
      userId: req.user._id,
      amount,
      paymentMethod,
      referenceNumber,
      notes,
      saleId,
      purchaseId,
      customerId,
      supplierId
    });

    // Automatically update balances
    if (saleId) {
      await Sale.findOneAndUpdate(
        { _id: saleId, userId: req.user._id },
        { $inc: { amountPaid: amount, outstandingAmount: -amount } }
      );
    }
    if (customerId) {
      await Customer.findOneAndUpdate(
        { _id: customerId, userId: req.user._id },
        { $inc: { outstandingBalance: -amount } }
      );
    }
    if (purchaseId) {
      await Purchase.findOneAndUpdate(
        { _id: purchaseId, userId: req.user._id },
        { $inc: { amountPaid: amount, outstandingAmount: -amount } }
      );
    }
    if (supplierId) {
      await Supplier.findOneAndUpdate(
        { _id: supplierId, userId: req.user._id },
        { $inc: { outstandingBalance: -amount } }
      );
    }

    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error('Payment creation error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing payment' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { saleId, purchaseId, customerId, supplierId } = req.query;
    const query = { userId: req.user._id };
    
    if (saleId) query.saleId = saleId;
    if (purchaseId) query.purchaseId = purchaseId;
    if (customerId) query.customerId = customerId;
    if (supplierId) query.supplierId = supplierId;

    const payments = await Payment.find(query).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving payments' });
  }
};

module.exports = { createPayment, getPayments };
