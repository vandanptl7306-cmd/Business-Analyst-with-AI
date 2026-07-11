// client/src/services/product.js

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Auto-inject JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Fetch all products / stock items */
export const getProductsList = async () => {
  const res = await API.get('/products');
  return res.data;
};

/** Fetch only low-stock or expiring-soon items */
export const getLowStockProducts = async () => {
  const res = await API.get('/products/low-stock');
  return res.data;
};

/** Add a new stock item */
export const createProduct = async (data) => {
  const res = await API.post('/products', data);
  return res.data;
};

/** Update an existing stock item (restock, edit details, etc.) */
export const updateProduct = async (id, data) => {
  const res = await API.put(`/products/${id}`, data);
  return res.data;
};

/** Delete a stock item */
export const deleteProduct = async (id) => {
  const res = await API.delete(`/products/${id}`);
  return res.data;
};

/** Manually deduct stock (e.g. wastage, returns) */
export const deductStock = async (id, quantity) => {
  const res = await API.post(`/products/${id}/deduct`, { quantity });
  return res.data;
};
