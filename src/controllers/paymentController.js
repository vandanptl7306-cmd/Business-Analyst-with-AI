// src/controllers/paymentController.js

const Invoice = require('../models/Invoice');
const PaymentTransaction = require('../models/PaymentTransaction');

/**
 * @desc    Record an incoming payment for an invoice
 * @route   POST /api/payments
 * @access  Private
 */
const receiveInvoicePayment = async (req, res) => {
  try {
    const { invoiceId, paymentMethod, amountReceived, transactionReference, isAdvance } = req.body;

    if (!invoiceId || !paymentMethod || !amountReceived) {
      return res.status(400).json({ success: false, error: 'Please provide invoiceId, paymentMethod, and amountReceived' });
    }

    const amt = Number(amountReceived);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: 'Received amount must be a positive number' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // ERROR VALIDATION LIMIT:
    // Verify that the incoming payment doesn't exceed the invoice's outstanding amount
    // unless the customer is paying an advance balance.
    const currentOutstanding = invoice.outstandingAmount || Number((invoice.grandTotal - invoice.amountPaid).toFixed(2));
    if (amt > currentOutstanding && !isAdvance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount $${amt} exceeds the remaining outstanding balance of $${currentOutstanding}. Please flag as 'Advance' if intentional.`,
      });
    }

    // Record transaction
    const transaction = await PaymentTransaction.create({
      invoiceId,
      paymentMethod,
      amountReceived: amt,
      transactionReference,
      isAdvance: !!isAdvance,
    });

    // Update Invoice status & values
    const newPaid = Number((invoice.amountPaid + amt).toFixed(2));
    const newOutstanding = Number((invoice.grandTotal - newPaid).toFixed(2));

    let newStatus = 'Unpaid';
    if (newOutstanding <= 0) {
      newStatus = 'Paid';
    } else if (newPaid > 0) {
      newStatus = 'Partially Paid';
    }

    invoice.amountPaid = newPaid;
    invoice.outstandingAmount = newOutstanding;
    invoice.status = newStatus;
    await invoice.save();

    res.status(201).json({
      success: true,
      message: `Successfully processed $${amt} payment via ${paymentMethod}.`,
      transaction,
      invoice,
    });
  } catch (error) {
    console.error('Receive payment error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing payment transaction' });
  }
};

/**
 * @desc    Get payment transactions history for a specific invoice
 * @route   GET /api/payments/invoice/:invoiceId
 * @access  Private
 */
const getInvoicePayments = async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({ invoiceId: req.params.invoiceId }).sort({ receivedAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch invoice payments error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving payments logs' });
  }
};

module.exports = {
  receiveInvoicePayment,
  getInvoicePayments,
};
