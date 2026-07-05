// src/middleware/profileValidation.js

const StoreSettings = require('../models/StoreSettings');

/**
 * Adaptive middleware that validates payload fields based on the active store settings businessType
 */
const validateProductProfile = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne({});
    const profile = settings ? settings.businessType : 'Retail';

    // RETAIL VALIDATION
    if (profile === 'Retail') {
      const { barcode } = req.body;
      if (barcode && barcode.length < 5) {
        return res.status(400).json({
          success: false,
          error: 'Retail Profile Validation Failure: Barcode must be at least 5 alphanumeric characters.',
        });
      }
    }

    // WHOLESALE VALIDATION
    if (profile === 'Wholesale') {
      const { minimumOrderQuantity, batchNumber } = req.body;
      if (minimumOrderQuantity && Number(minimumOrderQuantity) < 1) {
        return res.status(400).json({
          success: false,
          error: 'Wholesale Profile Validation Failure: Minimum Order Quantity (MOQ) cannot be less than 1.',
        });
      }
      if (!batchNumber) {
        return res.status(400).json({
          success: false,
          error: 'Wholesale Profile Validation Failure: Wholesale products require a valid Batch Number trace.',
        });
      }
    }

    // MANUFACTURING VALIDATION
    if (profile === 'Manufacturing') {
      const { rawMaterials } = req.body;
      if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Manufacturing Profile Validation Failure: Manufacturing products must specify a Bill of Materials (BOM) raw materials list.',
        });
      }

      // Check each raw material item
      for (let i = 0; i < rawMaterials.length; i++) {
        const material = rawMaterials[i];
        if (!material.name || !material.quantityNeeded || !material.unitCost) {
          return res.status(400).json({
            success: false,
            error: `Manufacturing Profile Validation Failure: Raw material at index ${i} requires name, quantityNeeded, and unitCost specifications.`,
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Profile validation middleware error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing profile adaptive validations' });
  }
};

module.exports = {
  validateProductProfile,
};
