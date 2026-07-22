// seed_mongodb.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Invoice = require('./src/models/Invoice');
const Party = require('./src/models/Party');
const Product = require('./src/models/Product');
const StoreSettings = require('./src/models/StoreSettings');
const Expense = require('./src/models/Expense');
const Firm = require('./src/models/Firm');

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    console.log('Connecting to MongoDB at', mongoURI);
    await mongoose.connect(mongoURI);
    console.log('Connected.');

    console.log('Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Invoice.deleteMany({}),
      Party.deleteMany({}),
      Product.deleteMany({}),
      StoreSettings.deleteMany({}),
      Expense.deleteMany({}),
      Firm.deleteMany({})
    ]);

    console.log('Inserting seed data...');

    const ADMIN_USER_ID = new mongoose.Types.ObjectId('60c72b2f9b1d8b2c88888888');

    // Users
    await User.create({
      _id: ADMIN_USER_ID,
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 10), // Hash password instead of using literal hash, or use literal
      role: 'Admin',
      isEmailVerified: true,
      phoneNumber: '',
      companyName: 'Business Analyst with AI Store',
    });

    // Parties
    await Party.insertMany([
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Client Alpha', phoneNumber: '+911234567890', outstandingBalance: 1200 },
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Client Beta', phoneNumber: '+919876543210', outstandingBalance: 450 },
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Gamma Industries', phoneNumber: '+919555666777', outstandingBalance: 0 }
    ]);

    // Products
    await Product.insertMany([
      {
        _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Organic Rice', sku: 'RIC-ORG-01',
        mrp: 85, sellingPrice: 80, averageCostPrice: 60, taxRate: 5, isTaxInclusive: true,
        quantity: 120, lowStockThreshold: 20, unit: 'kg',
        expiryDate: null, createdAt: new Date(), updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Premium Olive Oil', sku: 'OIL-PRE-02',
        mrp: 270, sellingPrice: 250, averageCostPrice: 180, taxRate: 12, isTaxInclusive: true,
        quantity: 8, lowStockThreshold: 10, unit: 'litre',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Organic Tea', sku: 'TEA-ORG-03',
        mrp: 50, sellingPrice: 45, averageCostPrice: 30, taxRate: 5, isTaxInclusive: true,
        quantity: 3, lowStockThreshold: 15, unit: 'pcs',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Whole Wheat Flour', sku: 'FLR-WW-04',
        mrp: 45, sellingPrice: 40, averageCostPrice: 28, taxRate: 0, isTaxInclusive: true,
        quantity: 55, lowStockThreshold: 10, unit: 'kg',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, name: 'Cold Press Coconut Oil', sku: 'OIL-COC-05',
        mrp: 180, sellingPrice: 165, averageCostPrice: 110, taxRate: 12, isTaxInclusive: true,
        quantity: 0, lowStockThreshold: 5, unit: 'litre',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(), updatedAt: new Date()
      }
    ]);

    // Store Settings
    await StoreSettings.create({
      _id: new mongoose.Types.ObjectId(),
      userId: ADMIN_USER_ID,
      shopName: 'Business Analyst with AI Store',
      businessType: 'Retail',
      address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana',
      phoneNumber: '+919876543210',
      email: 'billing@business-analyst.ai',
      gstin: '27AAAAA1111A1Z1',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      defaultInvoiceTemplate: 'Standard',
      invoiceThemeColor: '#2563eb',
      printerType: 'Regular',
      regularLayoutTheme: 'GST Theme 1',
      regularThemeColor: '#2563eb',
      printRepeatHeader: false,
      printCompanyName: true,
      customCompanyName: '',
      printCompanyLogo: true,
      customLogoUrl: '',
      printAddress: true,
      customAddress: '',
      printEmail: true,
      customEmail: '',
      printPhone: true,
      customPhone: '',
      printGSTIN: true,
      customGSTIN: '',
      paperSize: 'A4',
      orientation: 'Portrait',
      companyNameTextSize: 'Large',
      invoiceTextSize: 'Large',
      printTotalQty: true,
      amountWithDecimal: true,
      printReceivedAmount: true,
      printBalanceAmount: false,
      printCurrentBalance: false,
      printTaxDetails: true,
      printYouSaved: false,
      printAmountWithGrouping: true,
      amountInWordsFormat: 'Indian',
      printDescription: true,
      companyTagline: '',
      poReference: '',
      invoiceNotes: '',
      printBankDetails: false,
      bankAccountHolderName: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankBranchName: '',
      thermalPrintingType: 'Text Printing',
      thermalUseTextStylingBold: true,
      thermalAutoCut: true,
      thermalOpenCashDrawer: true,
      thermalExtraLines: 0,
      thermalCopies: 1,
      thermalPrintCompanyName: true,
      thermalCompanyName: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Expenses
    await Expense.insertMany([
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, category: 'Rent', description: 'Office Rent', amount: 1500, expenseDate: new Date() },
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, category: 'Utilities', description: 'Electricity Bill', amount: 350, expenseDate: new Date() },
      { _id: new mongoose.Types.ObjectId(), userId: ADMIN_USER_ID, category: 'Salaries', description: 'Employee Salaries', amount: 5000, expenseDate: new Date() }
    ]);

    // Firms
    await Firm.create({
      _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b2c77777701'),
      userId: ADMIN_USER_ID,
      name: 'My Company',
      address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana',
      phoneNumber: '+919876543210',
      email: 'billing@business-analyst.ai',
      gstin: '27AAAAA1111A1Z1',
      logoUrl: '',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
};

seedDB();
