import express from "express";
import mongoose from "mongoose";
import amqp from "amqplib";
import dotenv from "dotenv";
import client from "prom-client";

dotenv.config();

const app = express();

// 📊 Prometheus setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const ordersProcessed = new client.Counter({
  name: "orders_processed_total",
  help: "Total number of orders processed by the shipping service",
});
register.registerMetric(ordersProcessed);

// 🩺 Health check
app.get("/health", (_, res) => res.send("OK"));

// 📈 Metrics endpoint
app.get("/metrics", async (_, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ⚙️ Environment variables
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";
const AMQP_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
const PORT = process.env.SHIPPING_PORT || 3005;

// 🗃️ Mongoose schema
const shippingSchema = new mongoose.Schema({
  orderId: String,
  userId: String,
  items: Array,
  totalAmount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});
const Shipping = mongoose.model("Shipping", shippingSchema);

// 🔁 Retry logic for RabbitMQ
async function connectRabbitMQWithRetry(url, retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(url);
      console.log("✅ Connected to RabbitMQ");
      return conn;
    } catch (err) {
      console.warn(`⏳ RabbitMQ not ready (attempt ${i + 1}/${retries})...`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error("❌ Failed to connect to RabbitMQ after retries");
      }
    }
  }
}

// 🚀 Startup sequence
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB (shipping)");

    // Retry RabbitMQ connection until it's ready
    const connection = await connectRabbitMQWithRetry(AMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue("order_created", { durable: true });

    console.log("📦 Waiting for order messages...");

    channel.consume("order_created", async (msg) => {
      if (msg) {
        const order = JSON.parse(msg.content.toString());
        console.log("📬 Received order_created message:", order);

        const shipping = new Shipping({
          orderId: order.orderId,
          userId: order.userId,
          items: order.items,
          totalAmount: order.totalAmount,
          status: "processing",
        });
        await shipping.save();

        // ✅ Increment Prometheus metric
        ordersProcessed.inc();
        console.log(`✅ Shipping entry saved for orderId ${order.orderId}`);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error("❌ Shipping startup error:", err.message);
  }

  // Always start the API endpoints
  app.listen(PORT, () =>
    console.log(`🚚 Shipping service running on port ${PORT}`)
  );
}

start();
