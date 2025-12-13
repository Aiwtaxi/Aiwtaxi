import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YANDEX_TOKEN = process.env.YANDEX_TOKEN;

// --- health check ---
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hasToken: !!YANDEX_TOKEN
  });
});

// --- get driver by phone ---
app.get('/driver-by-phone', async (req, res) => {
  const phone = req.query.phone;

  if (!phone) {
    return res.status(400).json({
      error: 'phone query param is required'
    });
  }

  if (!YANDEX_TOKEN) {
    return res.status(500).json({
      error: 'YANDEX
