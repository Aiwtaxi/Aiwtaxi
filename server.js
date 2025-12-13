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
  try {
    const phone = req.query.phone;

    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    if (!YANDEX_TOKEN) {
      return res.status(500).json({ error: 'YANDEX_TOKEN missing' });
    }

    const response = await fetch(
      `https://fleet.yandex.ru/api/v1/drivers?phone=${encodeURIComponent(phone)}`,
      {
        headers: {
          Authorization: `Bearer ${YANDEX_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
