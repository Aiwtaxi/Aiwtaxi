const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

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
    hasParkId: !!PARK_ID,
  });
});

function normPhone(p = "") {
  let s = String(p).trim().replace(/\s+/g, "");
  if (s.startsWith("995")) s = "+" + s;
  return s;
}

app.get("/driver-by-phone", async (req, res) => {
  const phone = normPhone(req.query.phone || "");
  if (!phone) return res.status(400).json({ error: "phone is required" });
  if (!YANDEX_TOKEN) return res.status(500).json({ error: "YANDEX_TOKEN missing" });
  if (!PARK_ID) return res.status(500).json({ error: "PARK_ID missing" });

  try {
    const r = await fetch(
      "https://fleet-api.taxi.yandex.net/v1/parks/contractors/list",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": YANDEX_TOKEN,
        },
        body: JSON.stringify({
          park_id: PARK_ID,
          query: { phones: [phone] },
          limit: 1,
        }),
      }
    );

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch {}

    if (!r.ok) {
      return res.status(r.status).json({
        error: "Yandex API error",
        status: r.status,
        raw: text,
      });
    }

    const contractor = data?.contractors?.[0];
    if (!contractor) {
      return res.json({ success: true, found: false });
    }

    res.json({
      success: true,
      found: true,
      phone,
      name: contractor.name || null,
      balance: contractor.balance || null,
      contractor_id: contractor.id || null,
    });

  } catch (e) {
    res.status(500).json({ error: "server error", details: String(e) });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
