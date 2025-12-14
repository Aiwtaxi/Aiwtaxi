import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YANDEX_TOKEN = process.env.YANDEX_TOKEN;
const PARK_ID = process.env.PARK_ID;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    hasToken: !!YANDEX_TOKEN,
    hasParkId: !!PARK_ID
  });
});

app.get("/driver-by-phone", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ error: "phone is required" });
  }

  if (!YANDEX_TOKEN || !PARK_ID) {
    return res.status(500).json({ error: "env missing" });
  }

  try {
    const response = await fetch(
      "https://fleet-api.taxi.yandex.net/v1/parks/contractors/list",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": YANDEX_TOKEN
        },
        body: JSON.stringify({
          park_id: PARK_ID,
          limit: 1,
          query: {
            phones: [phone]
          }
        })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
