require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const { metricsMiddleware, metricsEndpoint } = require("./metrics");

const PORT = process.env.PORT || 8080;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth:3001";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://catalog:3002";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://cart:3003";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order:3004";
const SHIPPING_SERVICE_URL = process.env.SHIPPING_SERVICE_URL || "http://shipping:3005";

const app = express();
app.use(cors());

// 🧩 Register metrics middleware first, to catch *all* requests
app.use(metricsMiddleware("gateway"));

// ✅ Define /metrics and /health BEFORE any proxies
app.get("/metrics", metricsEndpoint);
app.get("/health", (_, res) => res.send("OK"));

console.log("[INIT] Registering proxies...");

// 🔐 Auth
app.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
    onProxyReq: fixRequestBody,
    logLevel: "warn",
  })
);

// 🛍️ Catalog
app.use(
  "/catalog",
  createProxyMiddleware({
    target: CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/catalog": "" },
    logLevel: "warn",
  })
);

// 🛒 Cart
app.use(
  "/cart",
  createProxyMiddleware({
    target: CART_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/cart": "" },
    logLevel: "warn",
  })
);

// 📦 Order
app.use(
  "/order",
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/order": "" },
    logLevel: "warn",
  })
);

// 🚚 Shipping
app.use(
  "/shipping",
  createProxyMiddleware({
    target: SHIPPING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/shipping": "" },
    logLevel: "warn",
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gateway running on port ${PORT}`);
  console.log(`🔗 Auth proxy → ${AUTH_SERVICE_URL}`);
  console.log(`🔗 Catalog proxy → ${CATALOG_SERVICE_URL}`);
  console.log(`🔗 Cart proxy → ${CART_SERVICE_URL}`);
  console.log(`🔗 Order proxy → ${ORDER_SERVICE_URL}`);
  console.log(`🔗 Shipping proxy → ${SHIPPING_SERVICE_URL}`);
});
