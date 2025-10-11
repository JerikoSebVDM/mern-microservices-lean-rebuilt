// services/shipping/index.js
import express from "express";
import mongoose from "mongoose";
import amqp from "amqplib";
import dotenv from "dotenv";
import client from "prom-client";

dotenv.config();
const app = express();

// ⚙️ Environment
const PORT = process.env.SHIPPING_PORT || 3005;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";
// ✅ Fixed to prioritize AMQP_URL (set in Kubernetes)
const AMQP_URL = process.env.AMQP_URL || process.env.RABBIT_URL || "amqp://user:pass@rabbitmq:5672";

// 📊 Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const ordersProcessed = new client.Counter({
  name: "orders_processed_total",
  help: "Total number of orders processed by the shipping service",
});
register.registerMetric(ordersProcessed);

// 🩺 Health & Metrics endpoints
app.get("/health", (_, res) => res.send("OK"));
app.get("/metrics", async (_, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 🗃️ Shipping schema
const shippingSchema = new mongoose.Schema({
  orderId: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
const Shipping = mongoose.model("Shipping", shippingSchema);

// 🕓 Robust RabbitMQ connection with retry
async function connectRabbitMQ(maxRetries = 10, delay = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await amqp.connect(AMQP_URL);
      console.log("✅ Connected to RabbitMQ");
      return conn;
    } catch (err) {
      console.log(`⏳ RabbitMQ not ready (attempt ${attempt}/${maxRetries})...`);
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// 🚀 Startup sequence
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB (shipping)");

    const connection = await connectRabbitMQ();
    const channel = await connection.createChannel();
    await channel.assertQueue("orders", { durable: true });
    console.log("📦 Waiting for order messages...");

    channel.consume("orders", async (msg) => {
      if (!msg) return;
      const order = JSON.parse(msg.content.toString());
      console.log("📬 Received order_created:", order);

      const shipping = new Shipping({
        orderId: order.orderId || new mongoose.Types.ObjectId().toString(),
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
        status: "processing",
      });

      await shipping.save();
      ordersProcessed.inc();
      console.log(`✅ Shipping entry saved for orderId ${shipping.orderId}`);
      channel.ack(msg);
    });
  } catch (err) {
    console.error("❌ Shipping startup error:", err.message);
  }

  app.listen(PORT, () => console.log(`🚚 Shipping service running on port ${PORT}`));
}

start();
