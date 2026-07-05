// client/src/services/settings.js

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
 * Fetch active store settings profile
 */
export const getStoreSettings = async () => {
  const response = await API.get('/settings');
  return response.data;
};

/**
 * Update store settings profile
 */
export const updateStoreSettings = async (settingsData) => {
  const response = await API.put('/settings', settingsData);
  return response.data;
};

/**
 * Update the business profile type of the store
 */
export const updateStoreProfile = async (businessType) => {
  const response = await API.put('/settings/profile', { businessType });
  return response.data;
};
