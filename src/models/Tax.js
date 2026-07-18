// src/models/Tax.js
const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true }, // e.g. "GST 18%"
    rate: { type: Number, required: true, min: 0 }, // e.g. 18
    type: { type: String, enum: ['GST', 'VAT', 'Custom'], default: 'GST' }
  },
  { timestamps: true }
);

// Ensure a user doesn't create duplicate tax rates with the same name
taxSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tax', taxSchema);
