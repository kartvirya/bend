const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Load API configuration
const apiConfig = {
  AUTH_TOKEN: 'UY_eAWHxXHT6Adb8OBIit0txV6SjHVFC3H_2_Em_hy0='
};

const app = express();
const PORT = 3000;

// Configure CORS to allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Auth-Token']
}));

// Manually set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Auth-Token');
  next();
});

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Auth-Token');
  res.sendStatus(200);
});

app.use(express.json());

app.all('/forward', async (req, res) => {
  try {
    const targetUrl = req.query.url; // Get target URL from query param
    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: { 'Auth-Token': apiConfig.AUTH_TOKEN },
      data: req.body,
      params: req.query,
    });

    res.status(response.status).set(response.headers).send(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));