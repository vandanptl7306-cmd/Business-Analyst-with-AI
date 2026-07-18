// src/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
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
    emailEnabled: { type: Boolean, default: true },
    outstandingBalance: { type: Number, default: 0 },
    gstin: { type: String, trim: true, default: '' },
    billingAddress: { type: String, trim: true, default: '' },
    pinCode: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
