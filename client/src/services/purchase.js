// client/src/services/purchase.js

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
 * Fetch all purchases
 */
export const getPurchases = async () => {
  const response = await API.get('/purchases');
  return response.data;
};

/**
 * Create a new purchase
 */
export const createPurchase = async (purchaseData) => {
  const response = await API.post('/purchases', purchaseData);
  return response.data;
};
