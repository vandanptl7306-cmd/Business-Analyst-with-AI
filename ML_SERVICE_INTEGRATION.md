# ML Service Integration Guide - Backend & Frontend

## 🎯 Overview

This guide explains how to integrate the AI Intelligence Layer (FastAPI microservice on port 8000) with your Node.js backend and React frontend.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                    │
│                                                                   │
│  Dashboard Components                                            │
│  - Inventory Dashboard                                           │
│  - Customer Segmentation Charts                                 │
│  - Anomaly Timeline                                             │
│  - Demand Forecast Graphs                                       │
│  - Price Optimization Panel                                     │
│  - Chat Widget                                                  │
└───────────────────────────┬──────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Port 5000-5003)              │
│                                                                   │
│  Routes (Protected with Auth)                                    │
│  - /api/analytics/* → Calls ML Service                         │
│  - /api/ml/* → Calls ML Service                                 │
│  - /api/forecast/* → Calls ML Service                          │
│                                                                   │
│  ML Service Client                                              │
│  - Error handling & retries                                     │
│  - Response transformation                                      │
│  - Caching layer                                                │
└───────────────────────────┬──────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         AI Intelligence Layer (FastAPI - Port 8000)              │
│                                                                   │
│  ✓ Inventory Optimization (EOQ)                                 │
│  ✓ Customer Segmentation (RFM)                                 │
│  ✓ Anomaly Detection (IsolationForest)                         │
│  ✓ Demand Forecasting (RandomForest)                           │
│  ✓ Price Optimization                                          │
│  ✓ NLP Chat (LangChain)                                        │
│  ✓ Dashboard Analytics                                         │
└───────────────────────────┬──────────────────────────────────────┘
                             │ PyMongo
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Backend Integration (Node.js)

### Step 1: Create ML Service Client

Create file: `src/services/mlService.js`

```javascript
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000
});

exports.getInventoryOptimization = async (orderingCost = 50, holdingCost = 2) => {
  const response = await mlClient.get('/api/ai/inventory/eoq', {
    params: { ordering_cost: orderingCost, holding_cost: holdingCost }
  });
  return response.data;
};

exports.getCustomerSegmentation = async (clusters = 3) => {
  const response = await mlClient.get('/api/ai/customers/segmentation', {
    params: { num_clusters: clusters }
  });
  return response.data;
};

exports.getAnomalies = async () => {
  const response = await mlClient.get('/api/ai/transactions/anomalies');
  return response.data;
};

exports.getDemandForecast = async (productId, days = 7) => {
  const response = await mlClient.get(`/api/ml/forecast/${productId}`, {
    params: { days }
  });
  return response.data;
};

exports.getPriceOptimization = async (productName) => {
  const response = await mlClient.get('/api/ai/price-optimization', {
    params: { product_name: productName }
  });
  return response.data;
};

exports.getChatResponse = async (message) => {
  const response = await mlClient.post('/api/ai/chat', { message });
  return response.data;
};

exports.getDashboardMetrics = async () => {
  const response = await mlClient.get('/api/analytics/dashboard-metrics');
  return response.data;
};

module.exports = exports;
```

### Step 2: Create Analytics Routes

Create file: `src/routes/ml.js`

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const mlService = require('../services/mlService');

// Protect all routes
router.use(protect);

router.get('/inventory', async (req, res) => {
  try {
    const data = await mlService.getInventoryOptimization();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const clusters = req.query.clusters || 3;
    const data = await mlService.getCustomerSegmentation(clusters);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/anomalies', async (req, res) => {
  try {
    const data = await mlService.getAnomalies();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/forecast/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const days = req.query.days || 7;
    const data = await mlService.getDemandForecast(productId, days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pricing', async (req, res) => {
  try {
    const { product } = req.query;
    if (!product) return res.status(400).json({ error: 'Product required' });
    const data = await mlService.getPriceOptimization(product);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const data = await mlService.getChatResponse(message);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const data = await mlService.getDashboardMetrics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 3: Register Routes in app.js

```javascript
// In src/app.js, add:
app.use('/api/ml', require('./routes/ml'));
```

---

## 💻 Frontend Integration (React)

### Step 1: Create Custom Hook

Create file: `client/src/hooks/useMlService.js`

```jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/ml';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/inventory`);
      return data;
    }
  });
};

export const useCustomers = (clusters = 3) => {
  return useQuery({
    queryKey: ['customers', clusters],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/customers`, {
        params: { clusters }
      });
      return data;
    }
  });
};

export const useAnomalies = () => {
  return useQuery({
    queryKey: ['anomalies'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/anomalies`);
      return data;
    }
  });
};

export const useForecast = (productId) => {
  return useQuery({
    queryKey: ['forecast', productId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/forecast/${productId}`);
      return data;
    },
    enabled: !!productId
  });
};

export const useChat = () => {
  return useMutation({
    mutationFn: async (message) => {
      const { data } = await axios.post(`${API_URL}/chat`, { message });
      return data;
    }
  });
};
```

### Step 2: Use in Components

```jsx
import { useInventory, useCustomers } from '../hooks/useMlService';

const Dashboard = () => {
  const { data: inventory } = useInventory();
  const { data: customers } = useCustomers(3);

  return (
    <div>
      <h1>AI Dashboard</h1>
      {inventory?.products?.map(p => (
        <div key={p.productId}>
          <h3>{p.name}</h3>
          <p>EOQ: {p.eoq}</p>
          <p>Reorder Point: {p.reorderPoint}</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
```

---

## ✅ Testing

### Backend Test

```bash
curl http://localhost:5000/api/ml/inventory
curl http://localhost:5000/api/ml/customers?clusters=3
curl http://localhost:5000/api/ml/forecast/Organic%20Rice
```

### Frontend Test

```jsx
// In React DevTools console
const { data } = await fetch('http://localhost:5000/api/ml/inventory').then(r => r.json());
console.log(data);
```

---

**Status**: ✅ ML Service running on port 8000  
**Next**: Integrate with your dashboard components
