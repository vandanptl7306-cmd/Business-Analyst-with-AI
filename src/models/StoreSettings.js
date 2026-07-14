// src/models/StoreSettings.js

const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
      default: 'IntellectBill AI Operations'
    },
    address: {
      type: String,
      required: true,
      trim: true,
      default: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana'
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '+919876543210'
    },
    email: {
      type: String,
      trim: true,
      default: 'billing@intellectbill.ai'
    },
    gstin: {
      type: String,
      trim: true,
      default: '27AAAAA1111A1Z1'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    defaultInvoiceTemplate: {
      type: String,
      enum: ['Standard', 'Modern', 'Thermal', 'TaxInvoice', 'Minimalist', 'Commercial', 'Proforma'],
      default: 'Standard',
    },
    invoiceThemeColor: {
      type: String,
      default: '#2563eb', // default blue
    },
    businessType: {
      type: String,
      enum: ['Retail', 'Wholesale', 'Manufacturing'],
      default: 'Retail',
    },
    businessCurrency: {
      type: String,
      default: '₹'
    },
    
    // Printer Type
    printerType: {
      type: String,
      enum: ['Regular', 'Thermal'],
      default: 'Regular'
    },

    // Regular Printer configuration
    regularLayoutTheme: {
      type: String,
      default: 'Standard'
    },
    regularThemeColor: {
      type: String,
      default: '#2563eb'
    },
    printRepeatHeader: {
      type: Boolean,
      default: false
    },
    
    // Print Company Info / Header toggles & overrides
    printCompanyName: {
      type: Boolean,
      default: true
    },
    customCompanyName: {
      type: String,
      default: ''
    },
    printCompanyLogo: {
      type: Boolean,
      default: true
    },
    customLogoUrl: {
      type: String,
      default: ''
    },
    printAddress: {
      type: Boolean,
      default: true
    },
    customAddress: {
      type: String,
      default: ''
    },
    printEmail: {
      type: Boolean,
      default: true
    },
    customEmail: {
      type: String,
      default: ''
    },
    printPhone: {
      type: Boolean,
      default: true
    },
    customPhone: {
      type: String,
      default: ''
    },
    printGSTIN: {
      type: Boolean,
      default: true
    },
    customGSTIN: {
      type: String,
      default: ''
    },
    autoSendWhatsApp: {
      type: Boolean,
      default: false
    },

    // Paper size, layout sizes
    paperSize: {
      type: String,
      enum: ['A4', 'A5', 'Letter', 'Legal'],
      default: 'A4'
    },
    orientation: {
      type: String,
      enum: ['Portrait', 'Landscape'],
      default: 'Portrait'
    },
    companyNameTextSize: {
      type: String,
      enum: ['Small', 'Medium', 'Large', 'Extra Large'],
      default: 'Large'
    },
    invoiceTextSize: {
      type: String,
      enum: ['Small', 'Medium', 'Large'],
      default: 'Large'
    },

    // Totals & Taxes checkboxes
    printTotalQty: {
      type: Boolean,
      default: true
    },
    amountWithDecimal: {
      type: Boolean,
      default: true
    },
    printReceivedAmount: {
      type: Boolean,
      default: true
    },
    printBalanceAmount: {
      type: Boolean,
      default: false
    },
    printCurrentBalance: {
      type: Boolean,
      default: false
    },
    printTaxDetails: {
      type: Boolean,
      default: true
    },
    printYouSaved: {
      type: Boolean,
      default: false
    },
    printAmountWithGrouping: {
      type: Boolean,
      default: true
    },
    amountInWordsFormat: {
      type: String,
      enum: ['Indian', 'International'],
      default: 'Indian'
    },

    // Layout-specific extra fields
    companyTagline: {
      type: String,
      default: ''
    },
    poReference: {
      type: String,
      default: ''
    },
    invoiceNotes: {
      type: String,
      default: ''
    },

    // Bank Details
    printBankDetails: {
      type: Boolean,
      default: false
    },
    bankAccountHolderName: {
      type: String,
      default: ''
    },
    bankName: {
      type: String,
      default: ''
    },
    bankAccountNumber: {
      type: String,
      default: ''
    },
    bankIfscCode: {
      type: String,
      default: ''
    },
    bankBranchName: {
      type: String,
      default: ''
    },
    bankQrCodeUrl: {
      type: String,
      default: ''
    },

    // Footer options
    printDescription: {
      type: Boolean,
      default: true
    },

    // Thermal Printer configuration
    thermalPrintingType: {
      type: String,
      enum: ['Text Printing', 'Graphics Printing'],
      default: 'Text Printing'
    },
    thermalUseTextStylingBold: {
      type: Boolean,
      default: true
    },
    thermalAutoCut: {
      type: Boolean,
      default: true
    },
    thermalOpenCashDrawer: {
      type: Boolean,
      default: true
    },
    thermalExtraLines: {
      type: Number,
      default: 0
    },
    thermalCopies: {
      type: Number,
      default: 1
    },
    thermalPrintCompanyName: {
      type: Boolean,
      default: true
    },
    thermalCompanyName: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
