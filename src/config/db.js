// src/config/db.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const setupMockDB = () => {
  console.log('--------------------------------------------------');
  console.log('MOCK DATABASE ACTIVATED (MongoDB is Offline)');
  console.log('Sign in using:');
  console.log('   - Email: admin@example.com');
  console.log('   - Password: password123');
  console.log('--------------------------------------------------');

  const store = {
    users: [
      {
        _id: new mongoose.Types.ObjectId('60c72b2f9b1d8b2c88888888'),
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$lL9WYyb4pN4751xlnlSmDuQYGTdI1iVrTwAOIb2omo1zLtDE10VzO',
        role: 'Admin',
        isEmailVerified: true
      }
    ],
    invoices: [],
    parties: [
      { _id: new mongoose.Types.ObjectId(), name: 'Client Alpha', phoneNumber: '+911234567890', outstandingBalance: 1200 },
      { _id: new mongoose.Types.ObjectId(), name: 'Client Beta', phoneNumber: '+919876543210', outstandingBalance: 450 },
      { _id: new mongoose.Types.ObjectId(), name: 'Gamma Industries', phoneNumber: '+919555666777', outstandingBalance: 0 }
    ],
    products: [
      { _id: new mongoose.Types.ObjectId(), name: 'Organic Rice', sku: 'RIC-ORG-01', mrp: 85, sellingPrice: 80, averageCostPrice: 60 },
      { _id: new mongoose.Types.ObjectId(), name: 'Premium Olive Oil', sku: 'OIL-PRE-02', mrp: 270, sellingPrice: 250, averageCostPrice: 180 },
      { _id: new mongoose.Types.ObjectId(), name: 'Organic Tea', sku: 'TEA-ORG-03', mrp: 50, sellingPrice: 45, averageCostPrice: 30 }
    ],
    storesettings: [
      {
        _id: new mongoose.Types.ObjectId(),
        shopName: 'IntellectBill AI Store',
        businessType: 'Retail',
        address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana',
        phoneNumber: '+919876543210',
        email: 'billing@intellectbill.ai',
        gstin: '27AAAAA1111A1Z1',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        defaultInvoiceTemplate: 'Standard'
      }
    ],
    paymenttransactions: [],
    expenses: [
      { _id: new mongoose.Types.ObjectId(), category: 'Rent', amount: 1500, expenseDate: new Date() },
      { _id: new mongoose.Types.ObjectId(), category: 'Utilities', amount: 350, expenseDate: new Date() },
      { _id: new mongoose.Types.ObjectId(), category: 'Salaries', amount: 5000, expenseDate: new Date() }
    ],
    datasynclogs: [],
    counters: [
      { _id: 'invoiceNumber', seq: 15 }
    ]
  };

  // Seed invoices
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const isPaid = i % 3 === 0;
    store.invoices.push({
      _id: new mongoose.Types.ObjectId(),
      invoiceNumber: `INV-26-27-0${10 + i}`,
      invoiceDate: date,
      buyerName: i % 2 === 0 ? 'Client Alpha' : 'Client Beta',
      buyerGSTIN: '27AAAAA1111A1Z1',
      buyerBillingAddress: '123 Business Rd, Mumbai',
      buyerPIN: '400001',
      sellerName: 'IntellectBill AI Store',
      sellerGSTIN: '27BBBBB2222B2Z2',
      sellerPIN: '400002',
      items: [
        { description: 'Organic Rice', hsnCode: '1006', quantity: 5, price: 80, basePrice: 80, gstRate: 18, totalAmount: 400, unitCostPrice: 60 }
      ],
      subTotal: 400,
      taxTotal: 72,
      grandTotal: 472,
      totalCost: 300,
      netProfit: 172,
      status: isPaid ? 'Paid' : 'Unpaid',
      amountPaid: isPaid ? 472 : 0,
      outstandingAmount: isPaid ? 0 : 472,
      createdAt: date,
      updatedAt: date
    });
  }

  const getCollectionKey = (modelName) => {
    return modelName.toLowerCase() + 's';
  };

  const matchesFilter = (item, filter) => {
    if (!filter || Object.keys(filter).length === 0) return true;
    return Object.keys(filter).every(key => {
      let filterVal = filter[key];
      let itemVal = item[key];
      
      if (key === '_id' && filterVal) {
        return item._id.toString() === filterVal.toString();
      }
      if (key === 'invoiceId' && filterVal) {
        return item.invoiceId && item.invoiceId.toString() === filterVal.toString();
      }
      if (key === 'tallyGuid' && filterVal) {
        return item.tallyGuid === filterVal;
      }
      if (key === 'email' && filterVal) {
        return String(item.email).toLowerCase() === String(filterVal).toLowerCase();
      }
      
      if (filterVal && typeof filterVal === 'object') {
        return true;
      }
      return String(itemVal) === String(filterVal);
    });
  };

  // Mock Query .exec()
  mongoose.Query.prototype.exec = async function() {
    const modelName = this.model.modelName;
    const collectionKey = getCollectionKey(modelName);
    const op = this.op;
    const filter = this._conditions || {};
    const update = this._update || {};
    const options = this.options || {};
    
    const collection = store[collectionKey] || [];
    
    const findItems = () => {
      return collection.filter(item => matchesFilter(item, filter));
    };

    if (op === 'find') {
      const items = findItems();
      return items.map(item => new this.model(item));
    }
    
    if (op === 'findOne') {
      const items = findItems();
      let found = items[0] || null;
      if (!found && modelName === 'User' && filter.email === 'admin@example.com') {
        found = store.users[0];
      }
      
      // Dynamic fallback for any requested ID that isn't found in mock DB
      if (!found && filter._id) {
        const requestedId = filter._id.toString();
        try {
          if (modelName === 'Invoice') {
            found = {
              _id: new mongoose.Types.ObjectId(requestedId),
              invoiceNumber: `INV-26-27-0999`,
              invoiceDate: new Date(),
              buyerName: 'Client Alpha',
              buyerGSTIN: '27AAAAA1111A1Z1',
              buyerBillingAddress: '123 Business Rd, Mumbai',
              buyerPIN: '400001',
              sellerName: 'IntellectBill AI Store',
              sellerGSTIN: '27BBBBB2222B2Z2',
              sellerPIN: '400002',
              items: [
                { description: 'Organic Rice', hsnCode: '1006', quantity: 5, price: 80, basePrice: 80, gstRate: 18, totalAmount: 400, unitCostPrice: 60 }
              ],
              subTotal: 400,
              taxTotal: 72,
              grandTotal: 472,
              totalCost: 300,
              netProfit: 172,
              status: 'Unpaid',
              amountPaid: 0,
              outstandingAmount: 472,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            store.invoices.push(found);
          } else if (modelName === 'Party') {
            found = {
              _id: new mongoose.Types.ObjectId(requestedId),
              name: 'Client Alpha',
              phoneNumber: '+911234567890',
              outstandingBalance: 1200,
              whatsappEnabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            store.parties.push(found);
          } else if (modelName === 'Product') {
            found = {
              _id: new mongoose.Types.ObjectId(requestedId),
              name: 'Organic Rice',
              sku: 'RIC-ORG-01',
              mrp: 85,
              sellingPrice: 80,
              averageCostPrice: 60,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            store.products.push(found);
          }
        } catch (e) {
          // If requestedId is not a valid ObjectId, ignore and return null
          found = null;
        }
      }
      return found ? new this.model(found) : null;
    }
    
    if (op === 'countDocuments') {
      const items = findItems();
      return items.length;
    }
    
    if (op === 'findOneAndUpdate' || op === 'updateOne') {
      let items = findItems();
      let foundObj = items[0];
      
      if (!foundObj) {
        if (options.upsert) {
          foundObj = {
            _id: filter._id || new mongoose.Types.ObjectId(),
            ...filter,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          collection.push(foundObj);
        } else {
          return null;
        }
      }
      
      // Apply updates
      if (update.$inc) {
        for (let k of Object.keys(update.$inc)) {
          foundObj[k] = (foundObj[k] || 0) + update.$inc[k];
        }
      }
      if (update.$set) {
        for (let k of Object.keys(update.$set)) {
          foundObj[k] = update.$set[k];
        }
      }
      if (!update.$set && !update.$inc) {
        for (let k of Object.keys(update)) {
          if (!k.startsWith('$')) {
            foundObj[k] = update[k];
          }
        }
      }
      
      foundObj.updatedAt = new Date();
      
      const idx = collection.findIndex(item => item._id.toString() === foundObj._id.toString());
      if (idx !== -1) {
        collection[idx] = foundObj;
      }
      
      return new this.model(foundObj);
    }
    
    if (op === 'deleteMany' || op === 'deleteOne') {
      const items = findItems();
      const ids = items.map(i => i._id.toString());
      store[collectionKey] = collection.filter(item => !ids.includes(item._id.toString()));
      return { deletedCount: items.length };
    }
    
    return null;
  };

  mongoose.Query.prototype.then = function(resolve, reject) {
    return this.exec().then(resolve, reject);
  };

  // Mock Aggregate
  mongoose.Aggregate.prototype.exec = async function() {
    const modelName = this._model.modelName;
    const collectionKey = getCollectionKey(modelName);
    const collection = store[collectionKey] || [];
    
    // Check if it is the GST Liability aggregation
    if (modelName === 'Invoice' && this._pipeline.some(stage => stage.$group && stage.$group.totalCgst)) {
      let totalCgst = 0, totalSgst = 0, totalIgst = 0;
      for (let inv of collection) {
        for (let item of (inv.items || [])) {
          totalCgst += item.cgst || 0;
          totalSgst += item.sgst || 0;
          totalIgst += item.igst || 0;
        }
      }
      return [{ _id: null, totalCgst, totalSgst, totalIgst }];
    }
    
    // Check if it is the Profit & Loss aggregation
    if (modelName === 'Invoice' && this._pipeline.some(stage => stage.$group && stage.$group.totalRevenue)) {
      let totalRevenue = 0, totalCogs = 0;
      for (let inv of collection) {
        totalRevenue += inv.totalRevenue || inv.subTotal || 0;
        totalCogs += inv.totalCost || 0;
      }
      return [{ _id: null, totalRevenue, totalCogs }];
    }
    
    // Check if it is the Sales Summary daily aggregation
    if (modelName === 'Invoice' && this._pipeline.some(stage => stage.$group && stage.$group.revenue)) {
      const datesMap = {};
      for (let inv of collection) {
        const dateStr = new Date(inv.invoiceDate || inv.createdAt).toISOString().split('T')[0];
        if (!datesMap[dateStr]) {
          datesMap[dateStr] = { _id: dateStr, revenue: 0, tax: 0, salesCount: 0 };
        }
        datesMap[dateStr].revenue += inv.subTotal || 0;
        datesMap[dateStr].tax += inv.taxTotal || 0;
        datesMap[dateStr].salesCount += 1;
      }
      return Object.values(datesMap).sort((a, b) => a._id.localeCompare(b._id));
    }
    
    // Check if it is the Sales Summary top products aggregation
    if (modelName === 'Invoice' && this._pipeline.some(stage => stage.$group && stage.$group.quantitySold)) {
      const prodsMap = {};
      for (let inv of collection) {
        for (let item of (inv.items || [])) {
          const desc = item.description || 'Unknown Product';
          if (!prodsMap[desc]) {
            prodsMap[desc] = { _id: desc, quantitySold: 0, totalSalesVal: 0 };
          }
          prodsMap[desc].quantitySold += item.quantity || 0;
          prodsMap[desc].totalSalesVal += item.totalAmount || 0;
        }
      }
      return Object.values(prodsMap).sort((a, b) => b.totalSalesVal - a.totalSalesVal).slice(0, 5);
    }

    // Check if it is the product total quantity aggregation for demand forecast
    if (modelName === 'Invoice' && this._pipeline.some(stage => stage.$group && stage.$group.totalQuantity)) {
      let targetProductId = null;
      for (let stage of this._pipeline) {
        if (stage.$match && stage.$match.$or) {
          const matchOr = stage.$match.$or;
          const matchDesc = matchOr.find(o => o['items.description'] !== undefined);
          if (matchDesc) targetProductId = matchDesc['items.description'];
        }
      }
      
      let totalQuantity = 0;
      let count = 0;
      for (let inv of collection) {
        for (let item of (inv.items || [])) {
          if (!targetProductId || item.description === targetProductId) {
            totalQuantity += item.quantity || 0;
            count += 1;
          }
        }
      }
      return [{ _id: null, totalQuantity, count }];
    }

    // Check if it is the Expense categorization aggregation
    if (modelName === 'Expense' && this._pipeline.some(stage => stage.$group && stage.$group.totalAmount)) {
      const expensesMap = {};
      for (let exp of collection) {
        const cat = exp.category || 'Other';
        if (!expensesMap[cat]) {
          expensesMap[cat] = { _id: cat, totalAmount: 0 };
        }
        expensesMap[cat].totalAmount += exp.amount || 0;
      }
      return Object.values(expensesMap);
    }
    
    return collection;
  };

  mongoose.Aggregate.prototype.then = function(resolve, reject) {
    return this.exec().then(resolve, reject);
  };

  // Mock Query chaining helpers
  mongoose.Query.prototype.sort = function() { return this; };
  mongoose.Query.prototype.select = function() { return this; };
  mongoose.Query.prototype.limit = function() { return this; };
  mongoose.Query.prototype.skip = function() { return this; };
  mongoose.Query.prototype.populate = function() { return this; };

  // Mock Model Saving and Creating
  mongoose.Model.create = async function(doc) {
    const modelName = this.modelName;
    const collectionKey = getCollectionKey(modelName);
    const collection = store[collectionKey] || [];
    
    if (modelName === 'User' && doc.password) {
      const salt = await bcrypt.genSalt(10);
      doc.password = await bcrypt.hash(doc.password, salt);
    }
    
    const newDoc = new this({
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    collection.push(newDoc.toObject ? newDoc.toObject({ virtuals: true }) : newDoc);
    return newDoc;
  };

  mongoose.Model.prototype.save = async function() {
    const modelName = this.constructor.modelName;
    const collectionKey = getCollectionKey(modelName);
    const collection = store[collectionKey] || [];
    
    if (modelName === 'User' && this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    const plainObj = this.toObject ? this.toObject({ virtuals: true }) : this;
    const idx = collection.findIndex(item => item._id.toString() === this._id.toString());
    if (idx !== -1) {
      collection[idx] = plainObj;
    } else {
      collection.push(plainObj);
    }
    return this;
  };
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    setupMockDB();
    return;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Error connecting to MongoDB: ${error.message}. Activating MockDB fallback...`);
    setupMockDB();
  }
};

module.exports = connectDB;
