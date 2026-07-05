// src/models/Expense.js

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['Rent', 'Salaries', 'Utilities', 'Inventory Purchase', 'Marketing', 'Others'],
      default: 'Others',
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true, // index for quick date filters reporting
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index exists on expenseDate to optimize aggregation queries
expenseSchema.index({ expenseDate: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
