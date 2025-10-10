import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import amqplib from "amqplib";
import client from "prom-client";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";
const AMQP_URL = process.env.RABBIT_URL || "amqp://rabbitmq:5672";

// --- Mongo setup ---
mongoose.connect(MONGO_URL);
const orderSchema = new mongoose.Schema({
  items: Array,
  total: Number,
  status: String,
  createdAt: Date,
});
const Order = mongoose.model("Order", orderSchema);

// --- Prometheus setup ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const ordersTotal = new client.Counter({
  name: "orders_total",
  help: "Total number of orders placed",
});
const ordersFailed = new client.Counter({
  name: "orders_failed_total",
  help: "Total number of failed order creations",
});
const totalRevenue = new client.Gauge({
  name: "orders_revenue_total",
  help: "Total revenue across all orders",
});
const lastOrderTimestamp = new client.Gauge({
  name: "orders_last_created_timestamp",
  help: "Unix timestamp of most recent order",
});
const orderProcessingDuration = new client.Histogram({
  name: "order_processing_duration_seconds",
  help: "Time taken to create and save an order",
  buckets: [0.1, 0.5, 1, 2, 5],
});

register.registerMetric(ordersTotal);
register.registerMetric(ordersFailed);
register.registerMetric(totalRevenue);
register.registerMetric(lastOrderTimestamp);
register.registerMetric(orderProcessingDuration);

// --- Routes ---
app.get("/health", (_, res) => res.send("OK"));

// Create order
app.post("/create", async (req, res) => {
  const start = Date.now();
  try {
    const { items } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Invalid order items" });

    const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0);

    const order = await Order.create({
      items,
      total,
      status: "created",
      createdAt: new Date(),
    });

    ordersTotal.inc();
    const revenue = await Order.aggregate([{ $group: { _id: null, sum: { $sum: "$total" } } }])
      .then((r) => (r[0] ? r[0].sum : 0));
    totalRevenue.set(revenue);
    lastOrderTimestamp.set(Date.now() / 1000);
    orderProcessingDuration.observe((Date.now() - start) / 1000);

    console.log("🧾 New order:", order);
    res.json({ ok: true, order });
  } catch (err) {
    console.error("❌ Order create failed:", err);
    ordersFailed.inc();
    orderProcessingDuration.observe((Date.now() - start) / 1000);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// RabbitMQ consumer
async function consumeOrders() {
  try {
    const conn = await amqplib.connect(AMQP_URL);
    const ch = await conn.createChannel();
    await ch.assertQueue("orders");

    ch.consume("orders", async (msg) => {
      const orderData = JSON.parse(msg.content.toString());
      console.log("📦 Received order from queue:", orderData);

      const start = Date.now();
      try {
        const total = orderData.items.reduce(
          (sum, i) => sum + (i.price || 0) * (i.qty || 1),
          0
        );

        const order = await Order.create({
          items: orderData.items,
          total,
          status: orderData.status || "created",
          createdAt: new Date(orderData.createdAt || Date.now()),
        });

        ordersTotal.inc();
        const revenue = await Order.aggregate([{ $group: { _id: null, sum: { $sum: "$total" } } }])
          .then((r) => (r[0] ? r[0].sum : 0));
        totalRevenue.set(revenue);
        lastOrderTimestamp.set(Date.now() / 1000);
        orderProcessingDuration.observe((Date.now() - start) / 1000);

        ch.ack(msg);
      } catch (err) {
        console.error("❌ Failed to process message:", err.message);
        ordersFailed.inc();
        orderProcessingDuration.observe((Date.now() - start) / 1000);
        ch.ack(msg);
      }
    });

    console.log("🐇 RabbitMQ consumer active (orders queue)");
  } catch (err) {
    console.error("❌ RabbitMQ consumer failed:", err.message);
  }
}

consumeOrders();

app.listen(PORT, () => console.log(`🚀 Order service running on port ${PORT}`));
