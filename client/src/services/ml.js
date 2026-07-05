// client/src/services/ml.js

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
 * Fetch Machine Learning demand forecasts for a product
 */
export const getProductDemandForecast = async (productId, days = 7) => {
  const response = await API.get(`/ml/forecast/${encodeURIComponent(productId)}`, {
    params: { days },
  });
  return response.data;
};
