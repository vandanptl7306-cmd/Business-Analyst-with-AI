// client/src/services/report.js

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Auto-inject JWT token from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch Sales summary & product performance statistics
 */
export const getSalesReport = async (startDate = '', endDate = '') => {
  const response = await API.get('/reports/sales-summary', { params: { startDate, endDate } });
  return response.data;
};

/**
 * Fetch Profit & Loss balance sheet summaries
 */
export const getProfitLossReport = async (startDate = '', endDate = '') => {
  const response = await API.get('/reports/profit-loss', { params: { startDate, endDate } });
  return response.data;
};

/**
 * Fetch GST Tax liability distributions and totals
 */
export const getGSTLiabilityReport = async (startDate = '', endDate = '') => {
  const response = await API.get('/reports/gst-liability', { params: { startDate, endDate } });
  return response.data;
};
