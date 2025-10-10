// services/auth/index.js
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { metricsMiddleware, metricsEndpoint } from "./metrics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/mern";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

app.use(express.json());
app.use(metricsMiddleware("auth"));

// ✅ Health + metrics
app.get("/health", (_, res) => res.status(200).send("OK"));
app.get("/metrics", metricsEndpoint);

// 🧩 User model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

// ✅ Signup
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    res.status(201).json({ message: `User ${user.email} registered successfully` });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB (auth service)");
    app.listen(PORT, () =>
      console.log(`🚀 Auth service running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Auth service failed to start:", err.message);
    process.exit(1);
  }
}

start();
