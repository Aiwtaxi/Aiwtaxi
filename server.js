import express from 'express';

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
    return res.status(400).json({ error: 'phone is required' });
  }

  if (!YANDEX_TOKEN) {
    return res.status(500).json({ error: 'YANDEX_TOKEN not set' });
  }

  try {
    const response = await fetch(
      'https://fleet-api.taxi.yandex.net/v1/parks/driver-profiles/list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': YANDEX_TOKEN,
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

app.listen(PORT, () => {
  console.log(`AIW Taxi backend running on port ${PORT}`);
});
