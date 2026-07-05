// src/models/DataSyncLog.js

const mongoose = require('mongoose');

const dataSyncLogSchema = new mongoose.Schema(
  {
    syncType: {
      type: String,
      enum: ['Import', 'Export'],
      required: true,
    },
    dataType: {
      type: String,
      enum: ['Ledger', 'StockItem', 'Voucher', 'Mixed'],
      required: true,
    },
    fileName: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Success', 'Partial', 'Failed'],
      required: true,
    },
    recordCount: {
      imported: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      exported: { type: Number, default: 0 },
    },
    errors: [
      {
        recordName: String,
        reason: String,
      },
    ],
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DataSyncLog', dataSyncLogSchema);
