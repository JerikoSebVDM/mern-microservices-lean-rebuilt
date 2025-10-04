require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');

const PORT = process.env.PORT || 3004;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/appdb';

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('order'));

let db, orders;
MongoClient.connect(MONGO_URL).then(client => {
  db = client.db();
  orders = db.collection('orders');
  console.log('order connected to mongo');
}).catch(console.error);

app.get('/metrics', metricsEndpoint());

app.post('/webhook/order', async (req, res) => {
  const payload = req.body || {};
  if (!payload.userId || !Array.isArray(payload.items)) {
    return res.status(400).json({ error: 'invalid payload' });
  }
  const doc = { ...payload, status: 'received' };
  await orders.insertOne(doc);
  res.json({ ok: true });
});

app.get('/orders', async (req, res) => {
  const list = await orders.find().sort({ _id: -1 }).limit(50).toArray();
  res.json(list);
});

app.listen(PORT, () => console.log('order on', PORT));
