// services/cart/index.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import amqplib from "amqplib";
import { metricsMiddleware, metricsEndpoint } from "./metrics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";
const AMQP_URL = process.env.AMQP_URL || "amqp://rabbitmq:5672";

app.use(express.json());
app.use(metricsMiddleware("cart"));

// ✅ Health + metrics
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/metrics", metricsEndpoint);

// ✅ Basic in-memory cart (demo)
let cart = [];

// ➕ Add item to cart
app.post("/add", (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || !qty)
    return res.status(400).json({ error: "productId and qty required" });

  const item = cart.find((i) => i.productId === productId);
  if (item) item.qty += qty;
  else cart.push({ productId, qty });

  res.json(cart);
});

// 🧾 View all cart items
app.get("/items", (_, res) => res.json(cart));

// 🛒 Checkout → publish order to RabbitMQ
app.post("/checkout", async (_, res) => {
  try {
    const conn = await amqplib.connect(AMQP_URL);
    const ch = await conn.createChannel();
    await ch.assertQueue("orders");

    const order = {
      items: cart,
      createdAt: new Date(),
      status: "created",
    };

    await ch.sendToQueue("orders", Buffer.from(JSON.stringify(order)));
    console.log("🛒 Published new order event:", order);

    await ch.close();
    await conn.close();

    cart = []; // clear cart after checkout
    res.json({ ok: true, message: "Order placed!" });
  } catch (err) {
    console.error("❌ Checkout failed:", err.message);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// 🚀 Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB (cart service)");
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Cart service running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Cart service failed to start:", err.message);
    process.exit(1);
  }
}

start();
