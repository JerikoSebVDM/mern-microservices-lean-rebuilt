require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');

const PORT = process.env.PORT || 3003;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/appdb';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_change_me';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order:3004';

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('cart'));

// observability
app.get('/metrics', metricsEndpoint());

// --- DB init ---
let db, carts;
(async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db();
  carts = db.collection('carts');
  console.log('cart connected to mongo');
})().catch(err => {
  console.error('mongo connection error:', err);
  process.exit(1);
});

// --- auth helper (JWT from Auth service) ---
function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  try {
    const token = h.slice('Bearer '.length);
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { uid: payload.uid || payload.id || payload.sub || payload.email || 'anon' }; // <-- add .uid
    next();
  } catch {
    return res.status(401).json({ error: 'bad token' });
  }
}

// --- routes expected by the gateway (note: NO /cart prefix here) ---

// add or increment an item
app.post('/add', auth, async (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const q = Math.max(1, Number(qty) || 1);

  const doc = await carts.findOne({ userId: req.user.uid }) || { userId: req.user.uid, items: [] };
  const idx = doc.items.findIndex(i => i.productId === productId);
  if (idx >= 0) doc.items[idx].qty += q;
  else doc.items.push({ productId, qty: q });

  await carts.updateOne({ userId: req.user.uid }, { $set: { items: doc.items } }, { upsert: true });
  res.json(doc.items);
});

// list items
app.get('/items', auth, async (req, res) => {
  const doc = await carts.findOne({ userId: req.user.uid });
  res.json(doc?.items || []);
});

// checkout via webhook to order service; then clear cart
app.post('/checkout', auth, async (req, res) => {
  const doc = await carts.findOne({ userId: req.user.uid });
  const items = doc?.items || [];

  try {
    await axios.post(`${ORDER_SERVICE_URL}/webhook/order`, {
      userId: req.user.uid,
      items,
      at: new Date().toISOString()
    }, { timeout: 5000 });

    await carts.updateOne({ userId: req.user.uid }, { $set: { items: [] } }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('webhook failed', e.message);
    res.status(502).json({ error: 'order service unavailable' });
  }
});
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log('cart on', PORT));
