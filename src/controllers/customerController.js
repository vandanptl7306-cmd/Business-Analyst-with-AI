// src/controllers/customerController.js
const Customer = require('../models/Customer');

const createCustomer = async (req, res) => {
  try {
    const { name, phoneNumber, email, emailEnabled, outstandingBalance, gstin, billingAddress, pinCode } = req.body;
    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Please provide name and phone number' });
    }

    let phone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) phone = `+91${phone}`;
      else phone = `+${phone}`;
    }

    const customer = await Customer.create({
      userId: req.user._id,
      name,
      phoneNumber: phone,
      email: email || '',
      emailEnabled: emailEnabled !== false,
      outstandingBalance: outstandingBalance || 0,
      gstin: gstin || '',
      billingAddress: billingAddress || '',
      pinCode: pinCode || '',
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    console.error('Create customer error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during customer creation' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error('Fetch customers error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving customers' });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.status(200).json({ success: true, customer });
  } catch (error) {
    console.error('Fetch customer error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving customer' });
  }
};

module.exports = { createCustomer, getCustomers, getCustomer };
