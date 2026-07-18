// src/controllers/partyController.js

const Party = require('../models/Party');
const emailService = require('../services/emailService');

/**
 * @desc    Create a new customer (Party)
 * @route   POST /api/parties
 * @access  Private
 */
const createParty = async (req, res) => {
  try {
    const { name, phoneNumber, email, emailEnabled, outstandingBalance } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Please provide name and phone number' });
    }

    let phone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (phone.startsWith('91') && phone.length === 12) {
        phone = `+${phone}`;
      } else {
        phone = `+${phone}`;
      }
    }

    const party = await Party.create({
      name,
      phoneNumber: phone,
      email: email || '',
      emailEnabled: emailEnabled !== false,
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
 * @desc    Send payment reminder to a Party via Email
 * @route   POST /api/parties/:id/send-reminder
 * @access  Private
 */
const sendPaymentReminder = async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    if (!party.emailEnabled) {
      return res.status(400).json({
        success: false,
        error: 'Email alerts are disabled for this customer.',
      });
    }

    if (party.outstandingBalance <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer has no outstanding balance.',
      });
    }

    if (!party.email || !emailService.isValidEmail(party.email)) {
      return res.status(400).json({
        success: false,
        error: `Customer email address '${party.email}' is missing or invalid.`,
      });
    }

    const paymentUrl = `https://intellectbill.ai/pay/${party._id}`;

    const response = await emailService.sendPaymentReminder(party.email, {
      name: party.name,
      outstandingBalance: party.outstandingBalance,
      paymentUrl,
    });

    res.status(200).json({
      success: true,
      message: `Email payment reminder successfully sent to ${party.name}.`,
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
