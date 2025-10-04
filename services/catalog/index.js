require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');

const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/appdb';

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('catalog'));

let db, products;
MongoClient.connect(MONGO_URL).then(async client => {
  db = client.db();
  products = db.collection('products');
  const count = await products.countDocuments();
  if (count === 0) {
    await products.insertMany([
      { sku: 'SKU-1', name: 'Demo Product 1', price: 19.99 },
      { sku: 'SKU-2', name: 'Demo Product 2', price: 29.99 },
      { sku: 'SKU-3', name: 'Demo Product 3', price: 39.99 }
    ]);
    console.log('catalog seeded');
  }
  console.log('catalog connected to mongo');
}).catch(console.error);

app.get('/metrics', metricsEndpoint());

app.get('/products', async (req, res) => {
  const list = await products.find().toArray();
  res.json(list);
});
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log('catalog on', PORT));
