// src/models/Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    phoneNumber: {
      type: String, required: true, trim: true,
      validate: {
        validator: function(v) { return /^\+[1-9]\d{1,14}$/.test(v); },
        message: props => `${props.value} is not a valid E.164 phone number!`
      }
    },
    email: { type: String, trim: true, default: '' },
    outstandingBalance: { type: Number, default: 0 },
    gstin: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
