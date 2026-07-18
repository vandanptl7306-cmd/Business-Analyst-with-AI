// src/controllers/categoryController.js
const Category = require('../models/Category');

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const category = await Category.create({
      userId: req.user._id,
      name,
      description: description || '',
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Category already exists' });
    res.status(500).json({ success: false, error: 'Server error creating category' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error retrieving categories' });
  }
};

module.exports = { createCategory, getCategories };
