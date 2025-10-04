require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');

const PORT = process.env.PORT || 8080;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth:3001';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog:3002';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart:3003';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order:3004';

const app = express();
app.use(cors());
app.use(metricsMiddleware('gateway'));

// metrics
app.get('/metrics', metricsEndpoint());

// 🔐 Auth Service (strip /auth prefix)
app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/auth': '' }
}));

// 📦 Catalog Service (strip /catalog prefix)
app.use('/catalog', createProxyMiddleware({
  target: CATALOG_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/catalog': '' }
}));

app.use('/cart', createProxyMiddleware({
  target: CART_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/cart': '' },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Authorization', req.headers['authorization'] || '');
  }
}));

// 📦 Order Service (strip /order prefix)
app.use('/order', createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/order': '' }
}));
app.get('/health', (req, res) => res.send('OK'));
// start gateway
app.listen(PORT, () => console.log(`gateway on ${PORT}`));
