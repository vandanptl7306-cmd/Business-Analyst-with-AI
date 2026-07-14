// src/controllers/firmController.js

const Firm = require('../models/Firm');

// GET /api/firms — list all firms
const getFirms = async (req, res) => {
  try {
    const firms = await Firm.find().sort({ isDefault: -1, createdAt: 1 });
    res.status(200).json({ success: true, firms });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch firms.' });
  }
};

// POST /api/firms — create a new firm
const createFirm = async (req, res) => {
  try {
    const { name, address, phoneNumber, email, gstin, logoUrl, isDefault } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Firm name is required.' });
    }
    const existingCount = await Firm.countDocuments();
    const firm = await Firm.create({
      name: name.trim(),
      address: address || '',
      phoneNumber: phoneNumber || '',
      email: email || '',
      gstin: gstin || '',
      logoUrl: logoUrl || '',
      isDefault: existingCount === 0 ? true : (isDefault || false),
    });
    res.status(201).json({ success: true, firm });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create firm.' });
  }
};

// PUT /api/firms/:id — update a firm
const updateFirm = async (req, res) => {
  try {
    const { name, address, phoneNumber, email, gstin, logoUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Firm name is required.' });
    }
    const firm = await Firm.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), address, phoneNumber, email, gstin, logoUrl },
      { new: true }
    );
    if (!firm) return res.status(404).json({ success: false, error: 'Firm not found.' });
    res.status(200).json({ success: true, firm });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update firm.' });
  }
};

// PUT /api/firms/:id/default — set a firm as default
const setDefaultFirm = async (req, res) => {
  try {
    // Unset all defaults first
    await Firm.updateMany({}, { isDefault: false });
    const firm = await Firm.findByIdAndUpdate(req.params.id, { isDefault: true }, { new: true });
    if (!firm) return res.status(404).json({ success: false, error: 'Firm not found.' });
    res.status(200).json({ success: true, firm });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to set default firm.' });
  }
};

// DELETE /api/firms/:id — delete a firm
const deleteFirm = async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.id);
    if (!firm) return res.status(404).json({ success: false, error: 'Firm not found.' });
    if (firm.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete the default firm. Set another firm as default first.' });
    }
    await Firm.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete firm.' });
  }
};

module.exports = { getFirms, createFirm, updateFirm, setDefaultFirm, deleteFirm };
