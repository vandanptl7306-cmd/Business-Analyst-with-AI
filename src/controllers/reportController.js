// src/controllers/reportController.js

const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

/**
 * @desc    Get Sales & Product Performance Summary
 * @route   GET /api/reports/sales-summary
 * @access  Private (Admin only)
 */
const getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.invoiceDate = {};
      if (startDate) matchQuery.invoiceDate.$gte = new Date(startDate);
      if (endDate) matchQuery.invoiceDate.$lte = new Date(endDate);
    }

    // Pipeline 1: Aggregated Daily Revenue & Taxes
    // PERFORMANCE OPTIMIZATION: Index on invoiceDate covers the $match stage.
    const salesAggregation = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } },
          revenue: { $sum: '$subTotal' },
          tax: { $sum: '$taxTotal' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pipeline 2: Top Performing Products (unwinding items grid)
    const productAggregation = await Invoice.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.description',
          quantitySold: { $sum: '$items.quantity' },
          totalSalesVal: { $sum: '$items.totalAmount' },
        },
      },
      { $sort: { totalSalesVal: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      salesTrend: salesAggregation,
      topProducts: productAggregation,
    });
  } catch (error) {
    console.error('Sales summary error:', error.message);
    res.status(500).json({ success: false, error: 'Server error compiling sales reports' });
  }
};

/**
 * @desc    Get Profit and Loss Financial Summary
 * @route   GET /api/reports/profit-loss
 * @access  Private (Admin only)
 */
const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const invoiceMatch = {};
    const expenseMatch = {};

    if (startDate || endDate) {
      invoiceMatch.invoiceDate = {};
      expenseMatch.expenseDate = {};
      if (startDate) {
        invoiceMatch.invoiceDate.$gte = new Date(startDate);
        expenseMatch.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        invoiceMatch.invoiceDate.$lte = new Date(endDate);
        expenseMatch.expenseDate.$lte = new Date(endDate);
      }
    }

    // Aggregate Invoices Sales & COGS
    const invoiceTotals = await Invoice.aggregate([
      { $match: invoiceMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' }, // net sales revenue excl GST
          totalCogs: { $sum: '$totalCost' },       // cost of stock sold
        },
      },
    ]);

    // Aggregate Expenses by category
    const expenseTotals = await Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const revenue = invoiceTotals[0] ? invoiceTotals[0].totalRevenue : 0;
    const cogs = invoiceTotals[0] ? invoiceTotals[0].totalCogs : 0;
    const grossProfit = Number((revenue - cogs).toFixed(2));

    const totalExpenses = expenseTotals.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const netProfit = Number((grossProfit - totalExpenses).toFixed(2));

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue: Number(revenue.toFixed(2)),
        totalCogs: Number(cogs.toFixed(2)),
        grossProfit,
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit,
        margin: revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0,
      },
      expensesBreakdown: expenseTotals,
    });
  } catch (error) {
    console.error('Profit loss summary error:', error.message);
    res.status(500).json({ success: false, error: 'Server error compiling P&L accounts' });
  }
};

/**
 * @desc    Get GST tax liability summary
 * @route   GET /api/reports/gst-liability
 * @access  Private (Admin only)
 */
const getGSTLiability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.invoiceDate = {};
      if (startDate) matchQuery.invoiceDate.$gte = new Date(startDate);
      if (endDate) matchQuery.invoiceDate.$lte = new Date(endDate);
    }

    // Aggregate tax collections (CGST, SGST, IGST)
    const gstTotals = await Invoice.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalCgst: { $sum: '$items.cgst' },
          totalSgst: { $sum: '$items.sgst' },
          totalIgst: { $sum: '$items.igst' },
        },
      },
    ]);

    const cgst = gstTotals[0] ? gstTotals[0].totalCgst : 0;
    const sgst = gstTotals[0] ? gstTotals[0].totalSgst : 0;
    const igst = gstTotals[0] ? gstTotals[0].totalIgst : 0;
    const totalCollected = Number((cgst + sgst + igst).toFixed(2));

    res.status(200).json({
      success: true,
      liability: {
        cgst: Number(cgst.toFixed(2)),
        sgst: Number(sgst.toFixed(2)),
        igst: Number(igst.toFixed(2)),
        totalCollected,
        inputTaxCredit: Number((totalCollected * 0.12).toFixed(2)), // standard 12% mock input tax credit estimate
        netPayable: Number((totalCollected - totalCollected * 0.12).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('GST Liability error:', error.message);
    res.status(500).json({ success: false, error: 'Server error compiling GST reports' });
  }
};

module.exports = {
  getSalesSummary,
  getProfitLoss,
  getGSTLiability,
};
