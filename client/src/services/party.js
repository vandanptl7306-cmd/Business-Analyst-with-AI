// client/src/services/party.js

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
 * Fetch all customers/parties
 */
export const getPartiesList = async () => {
  const response = await API.get('/parties');
  return response.data;
};

/**
 * Create a new customer/party
 */
export const createParty = async (partyData) => {
  const response = await API.post('/parties', partyData);
  return response.data;
};

/**
 * Send an outstanding payment reminder via Email
 */
export const sendEmailReminder = async (id) => {
  const response = await API.post(`/parties/${id}/send-reminder`);
  return response.data;
};

