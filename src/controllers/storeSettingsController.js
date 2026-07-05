// src/controllers/storeSettingsController.js

const StoreSettings = require('../models/StoreSettings');

/**
 * @desc    Get active store settings
 * @route   GET /api/settings
 * @access  Private
 */
const getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne({});
    if (!settings) {
      // Create default settings if none exist
      settings = await StoreSettings.create({
        shopName: 'IntellectBill AI Operations',
        address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana',
        phoneNumber: '+919876543210',
        email: 'billing@intellectbill.ai',
        gstin: '27AAAAA1111A1Z1',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150', // placeholder premium abstract logo
        defaultInvoiceTemplate: 'Standard'
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving store profile' });
  }
};

/**
 * @desc    Update store settings
 * @route   PUT /api/settings
 * @access  Private
 */
const updateStoreSettings = async (req, res) => {
  try {
    const { shopName, address, phoneNumber, email, gstin, logoUrl, defaultInvoiceTemplate } = req.body;

    let settings = await StoreSettings.findOne({});
    if (!settings) {
      settings = new StoreSettings({});
    }

    settings.shopName = shopName || settings.shopName;
    settings.address = address || settings.address;
    settings.phoneNumber = phoneNumber || settings.phoneNumber;
    settings.email = email || settings.email;
    settings.gstin = gstin || settings.gstin;
    settings.logoUrl = logoUrl || settings.logoUrl;
    settings.defaultInvoiceTemplate = defaultInvoiceTemplate || settings.defaultInvoiceTemplate;

    await settings.save();

    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating store profile' });
  }
};

/**
 * @desc    Update business profile type (Retail, Wholesale, Manufacturing)
 * @route   PUT /api/settings/profile
 * @access  Private
 */
const updateBusinessProfile = async (req, res) => {
  try {
    const { businessType } = req.body;

    const validProfiles = ['Retail', 'Wholesale', 'Manufacturing'];
    if (!businessType || !validProfiles.includes(businessType)) {
      return res.status(400).json({ success: false, error: 'Please specify a valid business profile type' });
    }

    let settings = await StoreSettings.findOne({});
    if (!settings) {
      settings = new StoreSettings({});
    }

    settings.businessType = businessType;
    await settings.save();

    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Update business profile type error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating business profile' });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  updateBusinessProfile,
};
