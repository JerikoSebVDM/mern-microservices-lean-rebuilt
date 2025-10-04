require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');

const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/appdb';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_change_me';

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('auth'));

let db, users;
MongoClient.connect(MONGO_URL).then(client => {
  db = client.db();
  users = db.collection('users');
  console.log('auth connected to mongo');
}).catch(console.error);

app.get('/metrics', metricsEndpoint());

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });
  const existing = await users.findOne({ email });
  if (existing) return res.status(409).json({ error: 'exists' });
  const hash = await bcrypt.hash(password, 10);
  await users.insertOne({ email, password: hash, createdAt: new Date() });
  res.json({ ok: true });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user) return res.status(401).json({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid' });
  const token = jwt.sign({ uid: user._id.toString(), email }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

app.get('/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: { id: payload.uid, email: payload.email } });
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
});

app.listen(PORT, () => console.log('auth on', PORT));
