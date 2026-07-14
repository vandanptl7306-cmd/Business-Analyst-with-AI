// src/controllers/storeSettingsController.js

const StoreSettings = require('../models/StoreSettings');

/**
 * @desc    Get active store settings
 * @route   GET /api/settings
 * @access  Private
 */
const getStoreSettings = async (req, res) => {
  try {
    // findOneAndUpdate with upsert ensures a document always exists and works
    // correctly with both MongoDB and the mock in-memory DB
    let settings = await StoreSettings.findOneAndUpdate(
      {},
      { $setOnInsert: {
          shopName: 'IntellectBill AI Operations',
          address: '101, Business Enclave, Cyber City, Sector 45, Gurgaon, Haryana',
          phoneNumber: '+919876543210',
          email: 'billing@intellectbill.ai',
          gstin: '27AAAAA1111A1Z1',
          logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
          defaultInvoiceTemplate: 'Standard'
        }
      },
      { new: true, upsert: true }
    );
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
    const fields = [
      'shopName', 'address', 'phoneNumber', 'email', 'gstin', 'logoUrl',
      'defaultInvoiceTemplate', 'invoiceThemeColor', 'businessType',
      'printerType', 'regularLayoutTheme', 'regularThemeColor',
      'printRepeatHeader', 'printCompanyName', 'customCompanyName',
      'printCompanyLogo', 'customLogoUrl', 'printAddress', 'customAddress',
      'printEmail', 'customEmail', 'printPhone', 'customPhone',
      'printGSTIN', 'customGSTIN', 'paperSize', 'orientation',
      'companyNameTextSize', 'invoiceTextSize', 'printTotalQty',
      'amountWithDecimal', 'printReceivedAmount', 'printBalanceAmount',
      'printCurrentBalance', 'printTaxDetails', 'printYouSaved',
      'printAmountWithGrouping', 'amountInWordsFormat', 'printDescription',
      'thermalPrintingType', 'thermalUseTextStylingBold', 'thermalAutoCut',
      'thermalOpenCashDrawer', 'thermalExtraLines', 'thermalCopies',
      'thermalPrintCompanyName', 'thermalCompanyName',
      'printBankDetails', 'bankAccountHolderName', 'bankName',
      'bankAccountNumber', 'bankIfscCode', 'bankBranchName', 'bankQrCodeUrl',
      'companyTagline', 'poReference', 'invoiceNotes'
    ];

    // Build $set patch from request body
    const patch = {};
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patch[field] = req.body[field];
      }
    });

    // findOneAndUpdate with upsert — works correctly with both real MongoDB and mock DB
    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: patch },
      { new: true, upsert: true }
    );

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

    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: { businessType } },
      { new: true, upsert: true }
    );

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
