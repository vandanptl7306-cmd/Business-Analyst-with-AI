// client/src/services/auth.js

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Automatically inject JWT token into requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Register user */
export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data);
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

/** Login user via standard email/password */
export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data);
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

/** Authenticate/register user via Google OAuth credential */
export const loginWithGoogle = async (idToken) => {
  const response = await API.post('/auth/google', { idToken });
  if (response.data.success && response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

/** Fetch current authenticated user's profile */
export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

/**
 * Update user profile (name, companyName, phoneNumber)
 * @param {Object} data - { name, companyName, phoneNumber }
 */
export const updateUserProfile = async (data) => {
  const response = await API.put('/auth/profile', data);
  return response.data;
};

/**
 * Change user password
 * @param {Object} data - { currentPassword, newPassword }
 */
export const changeUserPassword = async (data) => {
  const response = await API.put('/auth/password', data);
  return response.data;
};

/** Log out user (clear credentials) */
export const logoutUser = () => {
  localStorage.clear();
};
