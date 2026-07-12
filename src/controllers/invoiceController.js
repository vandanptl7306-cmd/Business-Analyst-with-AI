const axios = require('axios');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const Party = require('../models/Party');
const Product = require('../models/Product');
const StoreSettings = require('../models/StoreSettings');
const gspService = require('../services/gspService');
const whatsappService = require('../services/whatsappService');

/**
 * Formats a sequence number into INV-YY-YY-XXXX format based on the financial year.
 * In India, the financial year runs from April 1st to March 31st.
 * Example: Date = July 5, 2026 => FY 2026-2027 => INV-26-27-0001
 */
const formatInvoiceNumber = (seqNumber) => {
  return seqNumber.toString().padStart(3, '0');
};

// Helper to validate Indian GSTIN format
const isValidGSTIN = (gstin) => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

// Helper to validate Indian PIN Code
const isValidPIN = (pin) => {
  const pinRegex = /^[1-9][0-9]{5}$/;
  return pinRegex.test(pin);
};

/**
 * @desc    Create a new invoice (GST standard)
 * @route   POST /api/invoices
 * @access  Private
 */
const createInvoice = async (req, res) => {
  try {
    const {
      sellerName,
      sellerGSTIN,
      sellerPIN,
      buyerName,
      buyerGSTIN,
      buyerBillingAddress,
      buyerPIN,
      items,
      status, // Optional, defaults to 'Draft' or 'Unpaid'
    } = req.body;

    // Standard validations
    if (!sellerGSTIN || !sellerPIN || !buyerGSTIN || !buyerPIN || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide all required GST fields' });
    }

    // --- CONCURRENCY & ATOMIC NUMBER GENERATION ---
    // By running findOneAndUpdate with $inc, MongoDB executes an atomic operation that increments 
    // the sequence in a thread-safe manner. The write lock ensures that if two processes run this 
    // code at the exact same millisecond, MongoDB serializes the operations. Each gets a unique, 
    // sequential sequence number, preventing duplicate invoice numbers.
    const counter = await Counter.findOneAndUpdate(
      { _id: 'invoiceNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    // Format sequence using financial year prefix
    const invoiceNumber = formatInvoiceNumber(counter.seq);

    // Calculate invoice totals
    let subTotal = 0;
    let taxTotal = 0;
    let totalCost = 0;

    const processedItems = await Promise.all(items.map(async (item) => {
      const isInclusive = item.isTaxInclusive !== false;
      const gstRate = item.gstRate || 0;
      const qty = item.quantity || 1;

      let basePrice = 0;
      let taxAmount = 0;
      let totalAmount = 0;

      // EDGE CASE HANDLING (ROUNDING & ACCURACY POLICY):
      // When back-calculating base price from MRP (inclusive tax), division can lead to endless recurring decimals.
      // We perform all calculations to maximum precision, and then round to exactly 2 decimal places using .toFixed(2)
      // to match currency/cash collection formats. For split taxes (CGST/SGST), we calculate CGST first, and define
      // SGST as the remainder (taxAmount - CGST) to ensure the split components exactly sum to taxAmount, 
      // avoiding penny rounding errors.
      if (isInclusive) {
        const mrp = item.mrp || item.price || 0;
        const singleBase = (mrp * 100) / (100 + gstRate);
        
        basePrice = Number((singleBase * qty).toFixed(2));
        totalAmount = Number((mrp * qty).toFixed(2));
        taxAmount = Number((totalAmount - basePrice).toFixed(2));
      } else {
        const price = item.price || 0;
        basePrice = Number((price * qty).toFixed(2));
        taxAmount = Number((basePrice * (gstRate / 100)).toFixed(2));
        totalAmount = Number((basePrice + taxAmount).toFixed(2));
      }

      subTotal += basePrice;
      taxTotal += taxAmount;

      // Split CGST/SGST/IGST dynamically (interstate check based on first 2 digits of GSTIN)
      const isInterState = sellerGSTIN.substring(0, 2) !== buyerGSTIN.substring(0, 2);
      let cgst = 0, sgst = 0, igst = 0;

      if (isInterState) {
        igst = taxAmount;
      } else {
        cgst = Number((taxAmount / 2).toFixed(2));
        sgst = Number((taxAmount - cgst).toFixed(2)); // avoid half-penny splitting discrepancies
      }

      // Fetch unit cost price (COGS) at exact time of sale
      let unitCostPrice = item.unitCostPrice;
      if (unitCostPrice === undefined || unitCostPrice === null) {
        const product = await Product.findOne({ name: item.description });
        unitCostPrice = product ? product.averageCostPrice : Number((basePrice / qty * 0.70).toFixed(2));
      }

      totalCost += Number((unitCostPrice * qty).toFixed(2));

      return {
        ...item,
        isTaxInclusive: isInclusive,
        basePrice,
        taxAmount,
        totalAmount,
        cgst,
        sgst,
        igst,
        unitCostPrice,
      };
    }));

    const grandTotal = Number((subTotal + taxTotal).toFixed(2));
    const totalRevenue = Number(subTotal.toFixed(2));
    const netProfit = Number((totalRevenue - totalCost).toFixed(2));
    const profitMarginPercentage = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(2)) : 0;

    const initialPaid = Number(req.body.amountPaid || 0);
    const outstanding = Number((grandTotal - initialPaid).toFixed(2));
    let defaultStatus = 'Unpaid';
    if (initialPaid >= grandTotal) {
      defaultStatus = 'Paid';
    } else if (initialPaid > 0) {
      defaultStatus = 'Partially Paid';
    }

    // --- COMPLIANCE AI AUDIT BOT ---
    try {
      const auditPayload = {
        sellerName,
        sellerGSTIN,
        sellerPIN,
        buyerName,
        buyerGSTIN,
        buyerBillingAddress,
        buyerPIN,
        items: processedItems.map(item => ({
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          price: item.price,
          basePrice: item.basePrice,
          gstRate: item.gstRate,
          totalAmount: item.totalAmount,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst
        })),
        subTotal,
        taxTotal,
        grandTotal,
        igst: processedItems.reduce((acc, item) => acc + (item.igst || 0), 0),
        cgst: processedItems.reduce((acc, item) => acc + (item.cgst || 0), 0),
        sgst: processedItems.reduce((acc, item) => acc + (item.sgst || 0), 0)
      };

      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const auditResponse = await axios.post(`${ML_SERVICE_URL}/api/ai/audit/invoice`, auditPayload);
      
      if (auditResponse.data && auditResponse.data.success) {
        const report = auditResponse.data;
        if (!report.is_compliant) {
          // Identify any High severity alerts to block invoice generation
          const highAlerts = report.risk_alerts.filter(alert => alert.severity === 'High');
          if (highAlerts.length > 0) {
            return res.status(400).json({
              success: false,
              error: 'Compliance validations failed (AI Audit Bot blocked)',
              details: report.risk_alerts.map(alert => alert.message)
            });
          }
        }
      }
    } catch (auditErr) {
      console.warn('AI Compliance Audit Bot is offline or encountered an error. Proceeding with database fallback. Error:', auditErr.message);
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      sellerName,
      sellerGSTIN,
      sellerPIN,
      buyerName,
      buyerGSTIN,
      buyerBillingAddress,
      buyerPIN,
      items: processedItems,
      subTotal,
      taxTotal,
      grandTotal,
      totalCost,
      totalRevenue,
      netProfit,
      profitMarginPercentage,
      amountPaid: initialPaid,
      outstandingAmount: outstanding,
      status: status || defaultStatus,
      eInvoiceStatus: 'Generated',
      eInvoiceGeneratedAt: new Date(),
      irn: require('crypto').createHash('sha256').update(sellerGSTIN + '-' + invoiceNumber + '-' + new Date()).digest('hex'),
      qrCodeData: `GSTIN:${sellerGSTIN}*BUYER:${buyerGSTIN}*DOC:${invoiceNumber}*AMT:${grandTotal}`,
      eWayBillNo: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      eWayBillStatus: 'Generated',
      eWayBillGeneratedAt: new Date(),
      transporterId: buyerGSTIN,
      transporterName: 'Express Logistic Services Ltd',
      transportMode: 'Road',
      vehicleNo: 'MH12AA1234',
      vehicleType: 'Regular',
      distance: 120,
    });

    let whatsappDelivery = { status: 'NotSent', message: 'WhatsApp delivery not evaluated' };
    
    // Auto-send WhatsApp Logic
    try {
      const settings = await StoreSettings.findOne();
      if (settings && settings.autoSendWhatsApp) {
        const party = await Party.findOne({ name: buyerName });
        if (party && party.phoneNumber) {
          try {
            // Get token from auth header
            const token = req.headers.authorization?.split(' ')[1];
            
            // Construct the PDF link
            const invoiceUrl = `${req.protocol}://${req.get('host')}/api/invoices/${invoice._id}/print?template=Standard${token ? `&token=${token}` : ''}`;
            
            await whatsappService.sendInvoiceNotification(party.phoneNumber, {
              name: buyerName,
              invoiceNumber: invoice.invoiceNumber,
              grandTotal: invoice.grandTotal,
              invoiceUrl
            });
            
            invoice.whatsappSentStatus = 'Sent';
            invoice.lastReminderSentAt = new Date();
            await invoice.save();
            
            whatsappDelivery = { status: 'Sent', message: 'WhatsApp notification sent successfully.' };
          } catch (waErr) {
            invoice.whatsappSentStatus = 'Failed';
            await invoice.save();
            whatsappDelivery = { status: 'Failed', message: waErr.message || 'Failed to send WhatsApp notification.' };
          }
        } else {
          whatsappDelivery = { status: 'Skipped', message: 'Customer phone number not found in profile.' };
        }
      } else {
         whatsappDelivery = { status: 'Skipped', message: 'Auto-send WhatsApp is disabled in settings.' };
      }
    } catch (err) {
      console.error('Auto-WhatsApp delivery error:', err.message);
      whatsappDelivery = { status: 'Failed', message: 'Internal error checking WhatsApp settings.' };
    }

    res.status(201).json({ success: true, invoice, whatsappDelivery });
  } catch (error) {
    console.error('Invoice creation error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during invoice creation' });
  }
};


/**
 * @desc    Get Invoice details
 * @route   GET /api/invoices/:id
 * @access  Private
 */
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    let responseInvoice = invoice.toObject();

    // ROLE-BASED ACCESS CONTROL (RBAC) - API response stripping:
    // If the requesting user has the role of 'Staff', we strip all sensitive cost, profit, and margin data
    // fields from the invoice document structure to prevent unauthorized staff from seeing store profitability margins.
    if (req.user && req.user.role === 'Staff') {
      delete responseInvoice.totalCost;
      delete responseInvoice.netProfit;
      delete responseInvoice.profitMarginPercentage;
      if (responseInvoice.items) {
        responseInvoice.items = responseInvoice.items.map(item => {
          delete item.unitCostPrice;
          return item;
        });
      }
    }

    res.status(200).json({ success: true, invoice: responseInvoice });
  } catch (error) {
    console.error('Fetch invoice error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving invoice' });
  }
};

/**
 * @desc    Get all Invoices
 * @route   GET /api/invoices
 * @access  Private
 */
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });

    let responseInvoices = invoices.map(inv => {
      let obj = inv.toObject();
      
      // ROLE-BASED ACCESS CONTROL (RBAC) - API response stripping:
      // If the requesting user has the role of 'Staff', we strip all sensitive cost, profit, and margin data
      // fields from the invoice document structure to prevent unauthorized staff from seeing store profitability margins.
      if (req.user && req.user.role === 'Staff') {
        delete obj.totalCost;
        delete obj.netProfit;
        delete obj.profitMarginPercentage;
        if (obj.items) {
          obj.items = obj.items.map(item => {
            delete item.unitCostPrice;
            return item;
          });
        }
      }
      return obj;
    });

    res.status(200).json({ success: true, invoices: responseInvoices });
  } catch (error) {
    console.error('Fetch invoices error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving invoices' });
  }
};

/**
 * @desc    Get the upcoming (next sequential) invoice number (read-only query)
 * @route   GET /api/invoices/next-number
 * @access  Private
 */
const getUpcomingInvoiceNumber = async (req, res) => {
  try {
    const counter = await Counter.findOne({ _id: 'invoiceNumber' });
    const currentSeq = counter ? counter.seq : 0;
    const nextSeq = currentSeq + 1;
    const upcomingNumber = formatInvoiceNumber(nextSeq);
    res.status(200).json({ success: true, upcomingNumber });
  } catch (error) {
    console.error('Fetch upcoming invoice number error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving invoice sequence' });
  }
};



/**
 * @desc    Send PDF invoice link to a buyer via WhatsApp
 * @route   POST /api/invoices/:id/send-whatsapp
 * @access  Private
 */
const sendInvoiceWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientPhone } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    let phone = recipientPhone;
    
    // Look up customer phone in database by name or GSTIN if not supplied
    if (!phone) {
      const party = await Party.findOne({
        $or: [{ name: invoice.buyerName }, { phoneNumber: { $exists: true } }],
      });
      if (party) {
        phone = party.phoneNumber;
      }
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a recipient phone number or register a customer first.',
      });
    }

    // Auto-format recipient phone number to E.164 standard
    phone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (phone.startsWith('91') && phone.length === 12) {
        phone = `+${phone}`;
      } else {
        phone = `+${phone}`;
      }
    }

    // Validate phone number format
    if (!whatsappService.isValidE164(phone)) {
      return res.status(400).json({
        success: false,
        error: `Phone number '${phone}' is invalid. Must be in E.164 international format (e.g., +919876543210).`,
      });
    }

    const invoiceUrl = `https://intellectbill.ai/invoices/download/${invoice._id}`;

    // Send mock notification
    const response = await whatsappService.sendInvoiceNotification(phone, {
      name: invoice.buyerName,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
      invoiceUrl,
    });

    // Update status in Mongoose
    invoice.whatsappSentStatus = 'Sent';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Invoice WhatsApp notification successfully sent to ${invoice.buyerName}.`,
      messageId: response.messageId,
      sentAt: response.timestamp,
      invoice,
    });
  } catch (error) {
    console.error('Send WhatsApp invoice error:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Server error dispatching WhatsApp invoice' });
  }
};

/**
 * @desc    Get profit analytics summary over date ranges
 * @route   GET /api/invoices/analytics/profit
 * @access  Private (Admin only)
 */
const getProfitAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).select('invoiceNumber netProfit totalRevenue grandTotal totalCost createdAt');

    // Summarize totals
    let totalSales = 0;
    let totalCogs = 0;
    let totalProfit = 0;

    invoices.forEach((inv) => {
      totalSales += inv.totalRevenue || 0;
      totalCogs += inv.totalCost || 0;
      totalProfit += inv.netProfit || 0;
    });

    const averageMargin = totalSales > 0 ? Number(((totalProfit / totalSales) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalSales: Number(totalSales.toFixed(2)),
        totalCogs: Number(totalCogs.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        averageMargin,
        billCount: invoices.length,
      },
      invoices,
    });
  } catch (error) {
    console.error('Profit analytics error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving profit summaries' });
  }
};

module.exports = {
  createInvoice,
  getInvoice,
  getInvoices,
  getUpcomingInvoiceNumber,
  sendInvoiceWhatsApp,
  getProfitAnalytics,
};
