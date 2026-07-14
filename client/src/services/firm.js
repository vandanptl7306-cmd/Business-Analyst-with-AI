// client/src/services/firm.js

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getFirms = async () => (await API.get('/firms')).data;
export const createFirm = async (data) => (await API.post('/firms', data)).data;
export const updateFirm = async (id, data) => (await API.put(`/firms/${id}`, data)).data;
export const setDefaultFirm = async (id) => (await API.put(`/firms/${id}/default`)).data;
export const deleteFirm = async (id) => (await API.delete(`/firms/${id}`)).data;
