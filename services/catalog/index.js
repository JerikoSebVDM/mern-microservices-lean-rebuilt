import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { metricsMiddleware, metricsEndpoint } from "./metrics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";

// 🧭 Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(metricsMiddleware("catalog"));

// ✅ Serve local static images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Product schema & model
const ProductSchema = new mongoose.Schema({
  sku: String,
  name: String,
  price: Number,
  image: { type: String, default: "" },
});
const Product = mongoose.model("Product", ProductSchema);

// ✅ Health check + metrics
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/metrics", metricsEndpoint);

// 🧾 Fetch products from MongoDB
app.get("/products", async (_, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// 🌱 Seed database with your local image references
app.post("/seed", async (_, res) => {
  const demoProducts = [
    {
      sku: "desk01",
      name: "Modern Desk Lamp",
      price: 19.99,
      image: "/uploads/pexels-karolina-grabowska-7193648.jpg",
    },
    {
      sku: "chair01",
      name: "Ergonomic Office Chair",
      price: 49.99,
      image: "/uploads/ai-generated-8895614_1280.jpg",
    },
    {
      sku: "table01",
      name: "Minimalist Wooden Table",
      price: 89.99,
      image: "/uploads/0f96080c0a3aa99385137775d167e446.jpg",
    },
    {
      sku: "sofa01",
      name: "Grey Fabric Sofa",
      price: 129.99,
      image: "/uploads/c5b307a3cce636a7748a8bd44b700bfc.jpg",
    },
    {
      sku: "shelf01",
      name: "Industrial Bookshelf",
      price: 99.99,
      image: "/uploads/b9c02b41a78241a1861b3510952b85b1.jpg",
    },
    {
      sku: "lamp01",
      name: "Adjustable Floor Lamp",
      price: 39.99,
      image: "/uploads/3cb7dabd43e661203d02c7f35810644d.jpg",
    },
    {
      sku: "clock01",
      name: "Modern Wall Clock",
      price: 24.99,
      image: "/uploads/1cc20b859b5c296fdb78a3a8d57ac9c7.jpg",
    },
    {
      sku: "plant01",
      name: "Indoor Potted Plant",
      price: 14.99,
      image: "/uploads/1c2a0f667ca99e56b60ce3a48985967a.jpg",
    },
  ];

  try {
    await Product.deleteMany({});
    await Product.insertMany(demoProducts);
    res
      .status(200)
      .json({ message: "✅ Local product images seeded successfully" });
  } catch (err) {
    console.error("Seeding error:", err);
    res.status(500).json({ error: "Seeding failed" });
  }
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
