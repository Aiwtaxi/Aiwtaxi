import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hasToken: !!process.env.YANDEX_TOKEN,
  });
});

// get driver by phone
app.get('/driver-by-phone', async (req, res) => {
  const phone = req.query.phone;

  if (!phone) {
    return res.status(400).json({ error: 'phone is required' });
  }

  if (!process.env.YANDEX_TOKEN) {
    return res.status(500).json({ error: 'YANDEX_TOKEN not set' });
  }

  try {
    const response = await fetch(
      'https://fleet-api.taxi.yandex.net/v1/parks/driver-profiles/list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.YANDEX_TOKEN,
        },
        body: JSON.stringify({
          query: {
            phones: [phone],
          },
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
