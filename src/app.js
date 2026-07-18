// src/app.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());

// Enable CORS for frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Business Analyst with AI Backend' });
});

// Import models
const User = require('./models/User');

// Mount auth routes
app.use('/api/auth', require('./routes/auth'));

// Mount sale routes
app.use('/api/sales', require('./routes/sale'));

// Mount customer routes
app.use('/api/customers', require('./routes/customer'));

// Mount supplier routes
app.use('/api/suppliers', require('./routes/supplier'));

// Mount category routes
app.use('/api/categories', require('./routes/category'));

// Mount tax routes
app.use('/api/taxes', require('./routes/tax'));

// Mount payment routes
app.use('/api/payments', require('./routes/payment'));

// Mount settings routes
app.use('/api/settings', require('./routes/settings'));

// Mount products routes
app.use('/api/products', require('./routes/product'));

// Mount purchases routes
app.use('/api/purchases', require('./routes/purchase'));

// Mount reports routes
app.use('/api/reports', require('./routes/report'));

// Mount ml routes
app.use('/api/ml', require('./routes/ml'));

// Mount ai routes (Compliance Audit Bot)
app.use('/api/ai', require('./routes/ai'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Initialize DB Connection or Mock Database fallback
  await connectDB();

  const maxRetries = 5;
  let attempt = 0;
  let port = Number(PORT);

  const tryListen = () => {
    attempt += 1;
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use.`);
        if (attempt <= maxRetries) {
          port += 1;
          console.log(`Trying port ${port} (attempt ${attempt}/${maxRetries})`);
          // Small delay before retrying to avoid tight loop
          setTimeout(tryListen, 200);
          return;
        }
        console.error(`All ${maxRetries} retry attempts failed. Please free a port or set PORT env variable.`);
        process.exit(1);
      }
      // For other errors, rethrow
      console.error('Server error:', err);
      process.exit(1);
    });
  };

  tryListen();
};

startServer();
