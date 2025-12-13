import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YANDEX_TOKEN = process.env.YANDEX_TOKEN;

/**
 * Health check
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    hasToken: !!YANDEX_TOKEN
  });
});

/**
 * Get driver info by phone (DEBUG version)
 * Example:
 * /driver-by-phone?phone=+995598904878
 */
app.get('/driver-by-phone', async (req, res) => {
  const phone = req.query.phone;

  if (!phone) {
    return res.status(400).json({
      error: 'phone parameter is required'
    });
  }

  if (!YANDEX_TOKEN) {
    return res.status(500).json({
      error: 'YANDEX_TOKEN is missing in environment variables'
    });
  }

  try {
    const response = await fetch(
      'https://fleet-api.taxi.yandex.net/v1/parks/driver-profiles/list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': YANDEX_TOKEN
        },
        body: JSON.stringify({
          query: {
            phones: [phone]
          }
        })
      }
    );

    // ⬅️ ძალიან მნიშვნელოვანი: ვკითხულობთ TEXT-ს, არა JSON-ს
    const text = await response.text();

    return res.json({
      httpStatus: response.status,
      yandexRawResponse: text
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`AIW Taxi backend running on port ${PORT}`);
});
