// src/controllers/supplierController.js
const Supplier = require('../models/Supplier');

const createSupplier = async (req, res) => {
  try {
    const { name, phoneNumber, email, outstandingBalance, gstin, address } = req.body;
    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Please provide name and phone number' });
    }

    let phone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) phone = `+91${phone}`;
      else phone = `+${phone}`;
    }

    const supplier = await Supplier.create({
      userId: req.user._id,
      name,
      phoneNumber: phone,
      email: email || '',
      outstandingBalance: outstandingBalance || 0,
      gstin: gstin || '',
      address: address || '',
    });

    res.status(201).json({ success: true, supplier });
  } catch (error) {
    console.error('Create supplier error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during supplier creation' });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error('Fetch suppliers error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving suppliers' });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: req.user._id });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.status(200).json({ success: true, supplier });
  } catch (error) {
    console.error('Fetch supplier error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving supplier' });
  }
};

module.exports = { createSupplier, getSuppliers, getSupplier };
