// client/src/services/payment.js

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
 * Record an incoming transaction payment for an invoice
 */
export const recordPayment = async (paymentData) => {
  const response = await API.post('/payments', paymentData);
  return response.data;
};

/**
 * Fetch payments logs history list for an invoice
 */
export const getInvoicePayments = async (invoiceId) => {
  const response = await API.get(`/payments/invoice/${invoiceId}`);
  return response.data;
};
