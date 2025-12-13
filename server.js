import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// DRIVER BY PHONE (TEST VERSION – NO YANDEX)
app.get('/driver-by-phone', (req, res) => {
  let { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'phone is required' });
  }

  // წმენდა
  phone = phone.replace(/\s+/g, '').replace('+', '');

  // MOCK პასუხი (დროებით)
  return res.json({
    success: true,
    driver: {
      phone,
      name: 'Test Driver',
      balance: 105.00
    }
  });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
