// client/src/services/tally.js

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
 * Import Tally XML raw data payload
 */
export const importTallyXML = async (xmlString) => {
  const response = await API.post('/tally/import', { xml: xmlString });
  return response.data;
};

/**
 * Trigger Tally-compatible XML voucher database export download
 */
export const exportTallyXML = async (startDate = '', endDate = '') => {
  const response = await API.get('/tally/export', {
    params: { startDate, endDate },
    responseType: 'blob', // receive binary download file
  });
  return response.data;
};
export const getTallyExportUrl = (startDate = '', endDate = '') => {
  const token = localStorage.getItem('token');
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/tally/export?startDate=${startDate}&endDate=${endDate}&token=${token}`; // simple download wrapper
};
