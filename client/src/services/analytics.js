// client/src/services/analytics.js

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
 * Fetch advanced business analytics dashboard metrics trend summaries
 */
export const getDashboardAnalyticsMetrics = async (startDate = '', endDate = '', interval = 'daily') => {
  const response = await API.get('/ml/analytics/dashboard-metrics', {
    params: { start_date: startDate, end_date: endDate, interval },
  });
  return response.data;
};
