const axios = require('axios');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const Party = require('../models/Party');
const Product = require('../models/Product');
const gspService = require('../services/gspService');
const whatsappService = require('../services/whatsappService');

/**
 * Formats a sequence number into INV-YY-YY-XXXX format based on the financial year.
 * In India, the financial year runs from April 1st to March 31st.
 * Example: Date = July 5, 2026 => FY 2026-2027 => INV-26-27-0001
 */
const formatInvoiceNumber = (seqNumber, date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 is January, 3 is April
  
  let startYear, endYear;
  if (month >= 3) { // April (3) to December (11)
    startYear = year;
    endYear = year + 1;
  } else { // January (0) to March (2)
    startYear = year - 1;
    endYear = year;
  }
  
  const fyStart = startYear.toString().slice(-2);
  const fyEnd = endYear.toString().slice(-2);
  const formattedSeq = seqNumber.toString().padStart(4, '0');
  
  return `INV-${fyStart}-${fyEnd}-${formattedSeq}`;
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
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice creation error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during invoice creation' });
  }
};

/**
 * @desc    Generate E-Invoice & E-way Bill for an existing invoice
 * @route   POST /api/invoices/:id/compliance
 * @access  Private
 */
const generateComplianceData = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      transporterId,
      transporterName,
      transportMode,
      vehicleNo,
      vehicleType,
      distance,
    } = req.body;

    // 1. Fetch the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // 2. BACKEND COMPLIANCE VALIDATIONS
    const validationErrors = [];

    // Buyer & Seller GSTIN Validation
    if (!invoice.buyerGSTIN) {
      validationErrors.push('Buyer GSTIN is missing.');
    } else if (!isValidGSTIN(invoice.buyerGSTIN)) {
      validationErrors.push(`Buyer GSTIN '${invoice.buyerGSTIN}' format is invalid.`);
    }

    if (!invoice.sellerGSTIN) {
      validationErrors.push('Seller GSTIN is missing.');
    } else if (!isValidGSTIN(invoice.sellerGSTIN)) {
      validationErrors.push(`Seller GSTIN '${invoice.sellerGSTIN}' format is invalid.`);
    }

    // PIN Codes Validation
    if (!invoice.buyerPIN) {
      validationErrors.push('Buyer PIN Code is missing.');
    } else if (!isValidPIN(invoice.buyerPIN)) {
      validationErrors.push(`Buyer PIN Code '${invoice.buyerPIN}' must be a valid 6-digit number.`);
    }

    if (!invoice.sellerPIN) {
      validationErrors.push('Seller PIN Code is missing.');
    } else if (!isValidPIN(invoice.sellerPIN)) {
      validationErrors.push(`Seller PIN Code '${invoice.sellerPIN}' must be a valid 6-digit number.`);
    }

    // Item-level validations (HSN Code validation)
    if (!invoice.items || invoice.items.length === 0) {
      validationErrors.push('Invoice must contain at least one item.');
    } else {
      invoice.items.forEach((item, index) => {
        if (!item.hsnCode) {
          validationErrors.push(`Item ${index + 1}: HSN Code is missing.`);
        } else if (!/^[0-9]{4,8}$/.test(item.hsnCode)) {
          validationErrors.push(`Item ${index + 1}: HSN Code '${item.hsnCode}' must be a numeric value of 4 to 8 digits.`);
        }
      });
    }

    // Shipping & Transporter validations if E-Way bill parameters are provided
    if (transporterId && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(transporterId)) {
      validationErrors.push("Transporter ID must match a valid GSTIN/TRANSIN format.");
    }
    if (transportMode === 'Road' && !vehicleNo) {
      validationErrors.push("Vehicle number is required for Road transport mode.");
    }
    if (vehicleNo && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(vehicleNo.replace(/\s+/g, ''))) {
      validationErrors.push(`Vehicle Number '${vehicleNo}' format is invalid (Format e.g., DL01CA1234).`);
    }

    // If there are validation failures, return list
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Compliance validations failed',
        details: validationErrors,
      });
    }

    // 3. TRIGGER E-INVOICE GENERATION (NIC Mock)
    console.log(`Generating E-Invoice for Invoice ID: ${id}`);
    const eInvoiceResponse = await gspService.generateEInvoice(invoice);
    
    invoice.irn = eInvoiceResponse.irn;
    invoice.qrCodeData = eInvoiceResponse.qrCodeData;
    invoice.eInvoiceStatus = eInvoiceResponse.status;
    invoice.eInvoiceGeneratedAt = eInvoiceResponse.generatedAt;

    // 4. TRIGGER E-WAY BILL GENERATION (If transporter info is provided)
    if (transporterId || vehicleNo) {
      console.log(`Generating E-Way Bill for Invoice ID: ${id}`);
      const transportData = { transporterId, transporterName, transportMode, vehicleNo, vehicleType, distance };
      const eWayResponse = await gspService.generateEWayBill(transportData, invoice);

      invoice.eWayBillNo = eWayResponse.eWayBillNo;
      invoice.transporterId = transporterId;
      invoice.transporterName = transporterName;
      invoice.transportMode = transportMode;
      invoice.vehicleNo = vehicleNo;
      invoice.vehicleType = vehicleType;
      invoice.distance = distance;
      invoice.eWayBillStatus = eWayResponse.status;
      invoice.eWayBillGeneratedAt = eWayResponse.generatedAt;
    }

    // Save changes to database
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Compliance E-Invoice and E-Way Bill successfully generated.',
      invoice,
    });
  } catch (error) {
    console.error('Compliance generation error:', error.message);
    res.status(500).json({ success: false, error: 'Server error during compliance generation' });
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
 * @desc    Update an invoice's billing status
 * @route   PATCH /api/invoices/:id/status
 * @access  Private
 */
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid status option' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating invoice status' });
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
  generateComplianceData,
  getInvoice,
  getInvoices,
  getUpcomingInvoiceNumber,
  updateInvoiceStatus,
  sendInvoiceWhatsApp,
  getProfitAnalytics,
};
