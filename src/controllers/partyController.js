// src/controllers/partyController.js

const Party = require('../models/Party');
const whatsappService = require('../services/whatsappService');

/**
 * @desc    Create a new customer (Party)
 * @route   POST /api/parties
 * @access  Private
 */
const createParty = async (req, res) => {
  try {
    const { name, phoneNumber, whatsappEnabled, outstandingBalance } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Please provide name and phone number' });
    }

    // Standard phone check before creating
    if (!whatsappService.isValidE164(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: `Phone number '${phoneNumber}' is invalid. Must be in E.164 international format (e.g., +919876543210).`,
      });
    }

    const party = await Party.create({
      name,
      phoneNumber,
      whatsappEnabled: whatsappEnabled !== false,
      outstandingBalance: outstandingBalance || 0,
    });

    res.status(201).json({ success: true, party });
  } catch (error) {
    console.error('Create party error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during customer creation' });
  }
};

/**
 * @desc    Get all Parties
 * @route   GET /api/parties
 * @access  Private
 */
const getParties = async (req, res) => {
  try {
    const parties = await Party.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, parties });
  } catch (error) {
    console.error('Fetch parties error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving customers list' });
  }
};

/**
 * @desc    Get single Party by ID
 * @route   GET /api/parties/:id
 * @access  Private
 */
const getParty = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, party });
  } catch (error) {
    console.error('Fetch party error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving customer' });
  }
};

/**
 * @desc    Send payment reminder to a Party via WhatsApp
 * @route   POST /api/parties/:id/send-reminder
 * @access  Private
 */
const sendPaymentReminder = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (!party.whatsappEnabled) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp alerts are disabled for this customer.',
      });
    }

    if (party.outstandingBalance <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer has no outstanding balance.',
      });
    }

    // Verify format
    if (!whatsappService.isValidE164(party.phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: `Customer phone number '${party.phoneNumber}' must be in E.164 format.`,
      });
    }

    const paymentUrl = `https://intellectbill.ai/pay/${party._id}`;
    
    // Call mock integrations
    const response = await whatsappService.sendPaymentReminder(party.phoneNumber, {
      name: party.name,
      outstandingBalance: party.outstandingBalance,
      paymentUrl,
    });

    res.status(200).json({
      success: true,
      message: `WhatsApp payment reminder successfully sent to ${party.name}.`,
      messageId: response.messageId,
      sentAt: response.timestamp,
    });
  } catch (error) {
    console.error('Send reminder error:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Server error dispatching reminder' });
  }
};

module.exports = {
  createParty,
  getParties,
  getParty,
  sendPaymentReminder,
};
