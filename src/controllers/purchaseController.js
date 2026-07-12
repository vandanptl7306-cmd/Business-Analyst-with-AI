const Purchase = require('../models/Purchase');

exports.createPurchase = async (req, res) => {
  try {
    const purchaseData = { ...req.body, userId: req.user.id };
    const newPurchase = new Purchase(purchaseData);
    await newPurchase.save();
    res.status(201).json({ success: true, purchase: newPurchase });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
