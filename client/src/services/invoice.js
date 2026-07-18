// client/src/services/invoice.js

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
 * Fetch a single invoice by ID
 */
export const getInvoiceById = async (id) => {
  const response = await API.get(`/sales/${id}`);
  return response.data;
};

/**
 * Fetch all invoices
 */
export const getInvoicesList = async () => {
  const response = await API.get('/sales');
  return response.data;
};

/**
 * Trigger mock NIC E-Invoice & E-way Bill generation
 * @param {string} id - Invoice ID
 * @param {Object} complianceData - { transporterId, transporterName, transportMode, vehicleNo, vehicleType, distance }
 */
export const generateInvoiceCompliance = async (id, complianceData) => {
  const response = await API.post(`/sales/${id}/compliance`, complianceData);
  return response.data;
};

/**
 * Create a new GST invoice
 */
export const createInvoice = async (invoiceData) => {
  const response = await API.post('/sales', invoiceData);
  return response.data;
};

/**
 * Fetch the upcoming auto-generated invoice number
 */
export const getUpcomingInvoiceNumber = async () => {
  const response = await API.get('/sales/next-number');
  return response.data;
};

/**
 * Update the billing status of an invoice
 */
export const updateInvoiceStatus = async (id, status) => {
  const response = await API.patch(`/sales/${id}/status`, { status });
  return response.data;
};

/**
 * Send invoice PDF download URL via Email (Nodemailer)
 */
export const sendInvoiceEmail = async (id, recipientEmail = '') => {
  const response = await API.post(`/sales/${id}/send-email`, { recipientEmail });
  return response.data;
};

