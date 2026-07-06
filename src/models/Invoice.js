// src/models/Invoice.js

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  hsnCode: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  gstRate: {
    type: Number,
    required: true, // e.g., 5, 12, 18, 28
    enum: [0, 5, 12, 18, 28],
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  igst: {
    type: Number,
    default: 0,
  },
  mrp: {
    type: Number,
    min: 0,
  },
  isTaxInclusive: {
    type: Boolean,
    default: true,
  },
  basePrice: {
    type: Number,
    min: 0,
  },
  taxAmount: {
    type: Number,
    min: 0,
  },
  totalAmount: {
    type: Number,
    min: 0,
  },
  unitCostPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    // Record creation timestamp (added per request)
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Seller Info
    sellerName: {
      type: String,
      required: true,
    },
    sellerGSTIN: {
      type: String,
      required: true,
      trim: true,
    },
    sellerPIN: {
      type: String,
      required: true,
      trim: true,
    },

    // Buyer Info
    buyerName: {
      type: String,
      required: true,
    },
    buyerGSTIN: {
      type: String,
      required: true,
      trim: true,
    },
    buyerBillingAddress: {
      type: String,
      required: true,
    },
    buyerPIN: {
      type: String,
      required: true,
      trim: true,
    },

    // Goods/Services details
    items: [invoiceItemSchema],

    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'],
      default: 'Draft',
    },

    // --- E-INVOICE COMPLIANCE FIELDS ---
    irn: {
      type: String,
      trim: true,
    },
    qrCodeData: {
      type: String, // String representation of signed GSP QR code
    },
    eInvoiceStatus: {
      type: String,
      enum: ['NotGenerated', 'Generated', 'Failed'],
      default: 'NotGenerated',
    },
    eInvoiceGeneratedAt: {
      type: Date,
    },

    // --- E-WAY BILL COMPLIANCE FIELDS ---
    eWayBillNo: {
      type: String,
      trim: true,
    },
    transporterId: {
      type: String,
      trim: true,
    },
    transporterName: {
      type: String,
      trim: true,
    },
    transportMode: {
      type: String,
      enum: ['Road', 'Rail', 'Air', 'Ship'],
    },
    vehicleNo: {
      type: String,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['Regular', 'OverDimensional'],
    },
    distance: {
      type: Number, // distance in km
    },
    eWayBillStatus: {
      type: String,
      enum: ['NotGenerated', 'Generated', 'Failed'],
      default: 'NotGenerated',
    },
    eWayBillGeneratedAt: {
      type: Date,
    },
    // --- WHATSAPP COMMUNICATION LOGS ---
    whatsappSentStatus: {
      type: String,
      enum: ['NotSent', 'Pending', 'Sent', 'Failed'],
      default: 'NotSent',
    },
    lastReminderSentAt: {
      type: Date,
    },
    // --- TEMPLATE & LAYOUT SETTINGS ---
    billType: {
      type: String,
      enum: ['Invoice', 'Quotation', 'Proforma'],
      default: 'Invoice',
    },
    templateType: {
      type: String,
      enum: ['Standard', 'Modern', 'Thermal', 'TaxInvoice', 'Minimalist', 'Commercial'],
      default: 'Standard',
    },
    invoiceThemeColor: {
      type: String,
      default: '#2563eb',
    },
    storeSnapshot: {
      shopName: String,
      address: String,
      phoneNumber: String,
      email: String,
      gstin: String,
      logoUrl: String,
    },
    // --- PROFITABILITY METRICS ---
    totalCost: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    profitMarginPercentage: {
      type: Number,
      default: 0,
    },
    tallyGuid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // --- PAYMENT TRACKING ---
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// PERFORMANCE OPTIMIZATION INDEX POLICY:
// Adding single-field indexes on date parameters ensures that the Reports Dashboard aggregation pipelines 
// ($match filters) can isolate transactions over range metrics instantly without scanning entire database collections,
// maintaining sub-second load times even with thousands of records.
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
