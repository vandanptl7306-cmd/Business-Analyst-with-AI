// src/controllers/mlController.js

const axios = require('axios');
const Sale = require('../models/Sale');

// ML Microservice base URL from env variables
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * @desc    Get ML Demand Forecast for a product
 * @route   GET /api/ml/forecast/:productId
 * @access  Private
 */
const getDemandForecast = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days } = req.query;
    const forecastHorizon = days || 7;

    try {
      // Query the FastAPI Python Microservice
      const response = await axios.get(`${ML_SERVICE_URL}/api/ml/forecast/${encodeURIComponent(productId)}`, {
        params: { days: forecastHorizon }
      });
      return res.status(200).json(response.data);
    } catch (mlErr) {
      console.warn('ML Microservice is offline/unreachable. Falling back to MongoDB database average calculation...');
      
      // FALLBACK STATS BACKEND LOGIC:
      // If the Python service is offline, compute the 30-day average sales of this item
      // to supply standard projection arrays.
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const salesData = await Sale.aggregate([
        { $match: { userId: req.user._id, invoiceDate: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        {
          $match: {
            $or: [
              { 'items.description': productId },
              { 'items.productId': productId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$items.quantity' },
            count: { $sum: 1 }
          }
        }
      ]);

      const avgDaily = salesData[0] ? Number((salesData[0].totalQuantity / 30).toFixed(2)) : 5.0;

      const fallbackForecast = [];
      const today = new Date();
      for (let i = 1; i <= Number(forecastHorizon); i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        fallbackForecast.push({
          date: nextDate.toISOString().split('T')[0],
          predicted_quantity: Math.max(0, avgDaily + (Math.random() * 2 - 1))
        });
      }

      return res.status(200).json({
        success: true,
        productId,
        model: 'Database Average Fallback (ML Microservice Offline)',
        days: forecastHorizon,
        forecast: fallbackForecast
      });
    }
  } catch (error) {
    console.error('Proxy forecast query error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing demand forecast request' });
  }
};

/**
 * @desc    Get dashboard metrics analytics trend summaries
 * @route   GET /api/ml/analytics/dashboard-metrics
 * @access  Private
 */
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all sales for this user
    const invoices = await Sale.find({ userId });
    
    // Calculate actual metrics from invoices
    const totalRev = invoices.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const totalProfit = invoices.reduce((acc, curr) => acc + (curr.netProfit || 0), 0);
    
    // Group invoices by date for trend analysis
    const trendMap = {};
    invoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate || inv.createdAt);
      const dateStr = invDate.toISOString().split('T')[0];
      
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { revenue: 0, profit: 0, count: 0 };
      }
      trendMap[dateStr].revenue += inv.grandTotal || 0;
      trendMap[dateStr].profit += inv.netProfit || 0;
      trendMap[dateStr].count += 1;
    });

    const trendData = Object.entries(trendMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-7) // Last 7 days
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(data.profit * 100) / 100,
        sales_count: data.count,
        revenue_growth: 0,
        sales_growth: 0
      }));
      
    // Fetch Customers
    const Customer = require('../models/Customer');
    const customers = await Customer.find({ userId });
    
    // Calculate repeat customer rate
    const buyerCounts = {};
    invoices.forEach(inv => {
        const buyer = inv.buyerName || 'Unknown';
        buyerCounts[buyer] = (buyerCounts[buyer] || 0) + 1;
    });
    
    const uniqueBuyers = Object.keys(buyerCounts).length;
    let repeatBuyers = 0;
    Object.values(buyerCounts).forEach(count => {
        if (count > 1) repeatBuyers++;
    });
    
    const repeatRate = uniqueBuyers > 0 ? Math.round((repeatBuyers / uniqueBuyers) * 1000) / 10 : 0;

    return res.status(200).json({
      success: true,
      kpis: {
        totalRevenue: Math.round(totalRev * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        salesVolume: invoices.length,
        customersAcquired: customers.length,
        repeatCustomerRate: repeatRate
      },
      trendData: trendData.length > 0 ? trendData : [{
        date: new Date().toISOString().split('T')[0],
        revenue: totalRev,
        profit: totalProfit,
        sales_count: invoices.length,
        revenue_growth: 0,
        sales_growth: 0
      }]
    });

  } catch (error) {
    console.error('Analytics query error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing analytics trend query' });
  }
};

/**
 * @desc    Get Matplotlib trend chart image
 * @route   GET /api/ml/analytics/trend-chart
 * @access  Private
 */
const getTrendChart = async (req, res) => {
  try {
    const { metric } = req.query;
    // Force fallback to frontend React Recharts to ensure multi-tenant data isolation
    // The Python ML service currently lacks userId filtering and reads globally.
    return res.status(200).json({ success: false, fallback: true });
  } catch (error) {
    console.error('Proxy trend chart query error:', error.message);
    res.status(500).json({ success: false, error: 'Server error processing trend chart query' });
  }
};

module.exports = {
  getDemandForecast,
  getDashboardMetrics,
  getTrendChart,
};
