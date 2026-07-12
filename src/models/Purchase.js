const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnCode: { type: String, default: '0000' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 0 },
  discountAmt: { type: Number, default: 0 },
  taxAmt: { type: Number, default: 0 },
  amount: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  party: { type: String, required: true },
  phone: { type: String },
  billNumber: { type: String },
  billDate: { type: String },
  stateOfSupply: { type: String },
  items: [purchaseItemSchema],
  paymentType: { type: String, default: 'Cash' },
  description: { type: String },
  subTotalAmount: { type: Number, required: true },
  totalTaxAmt: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
