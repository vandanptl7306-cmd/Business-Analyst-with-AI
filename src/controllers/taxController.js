// src/controllers/taxController.js
const Tax = require('../models/Tax');

const createTax = async (req, res) => {
  try {
    const { name, rate, type } = req.body;
    if (!name || rate === undefined) return res.status(400).json({ success: false, error: 'Name and rate are required' });

    const tax = await Tax.create({
      userId: req.user._id,
      name,
      rate,
      type: type || 'GST',
    });
    res.status(201).json({ success: true, tax });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Tax rate already exists' });
    res.status(500).json({ success: false, error: 'Server error creating tax rate' });
  }
};

const getTaxes = async (req, res) => {
  try {
    const taxes = await Tax.find({ userId: req.user._id }).sort({ rate: 1 });
    res.status(200).json({ success: true, taxes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving taxes' });
  }
};

module.exports = { createTax, getTaxes };
