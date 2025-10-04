require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');
const { orderReceived, orderCompleted, register } = require('./metrics');

const PORT = process.env.PORT || 3004;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/appdb';
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('order'));

let db, orders;
MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db();
    orders = db.collection('orders');
    console.log('✅ order connected to mongo');
  })
  .catch(console.error);

// expose metrics
app.get('/metrics', metricsEndpoint());

// --- receive webhook from cart checkout ---
app.post('/webhook/order', async (req, res) => {
  const payload = req.body || {};
  if (!payload.userId || !Array.isArray(payload.items)) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  const doc = {
    ...payload,
    status: 'received',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await orders.insertOne(doc);
  orderReceived.inc(); // metrics
  res.json({ ok: true });
});

// --- get orders for the logged-in user ---
app.get('/orders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const list = await orders.find({ userId: decoded.userId }).sort({ _id: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- get all orders (for debug/admin) ---
app.get('/orders/all', async (req, res) => {
  const list = await orders.find().sort({ _id: -1 }).toArray();
  res.json(list);
});

// --- update order status manually (demo) ---
app.put('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Missing status' });

  await orders.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );

  if (status === 'completed') orderCompleted.inc(); // metrics
  res.json({ message: 'Order status updated' });
});

app.listen(PORT, () => console.log(`✅ order on ${PORT}`));
