// src/app.js

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Business Analyst with AI Backend' });
});

// Import models
const User = require('./models/User');

// Mount auth routes
app.use('/api/auth', require('./routes/auth'));

// Mount invoice routes
app.use('/api/invoices', require('./routes/invoice'));

// Mount party routes
app.use('/api/parties', require('./routes/party'));

// Mount settings routes
app.use('/api/settings', require('./routes/settings'));

// Mount tally routes
app.use('/api/tally', require('./routes/tally'));

// Mount payments routes
app.use('/api/payments', require('./routes/payment'));

// Mount reports routes
app.use('/api/reports', require('./routes/report'));

// Mount products routes
app.use('/api/products', require('./routes/product'));

// Mount ml routes
app.use('/api/ml', require('./routes/ml'));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database if MONGO_URI is set
  if (process.env.MONGO_URI) {
    await connectDB();
  } else {
    console.log('MONGO_URI not specified. Skipping DB connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
