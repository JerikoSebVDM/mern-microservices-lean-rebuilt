// services/catalog/index.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { metricsMiddleware, metricsEndpoint } from "./metrics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";

app.use(express.json());
app.use(metricsMiddleware("catalog"));

// ✅ Health + metrics
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/metrics", metricsEndpoint);

// 🧾 Sample product list
app.get("/products", async (_, res) => {
  const products = [
    { sku: "desk01", name: "Demo Product 1", price: 19.99 },
    { sku: "chair01", name: "Demo Product 2", price: 49.99 },
    { sku: "lamp01", name: "Demo Product 3", price: 29.99 },
  ];
  res.json(products);
});

// 🚀 Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB (catalog service)");
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Catalog service running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Catalog service failed to start:", err.message);
    process.exit(1);
  }
}

start();
