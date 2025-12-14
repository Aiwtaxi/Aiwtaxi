const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YANDEX_TOKEN = process.env.YANDEX_TOKEN;
const PARK_ID = process.env.PARK_ID;

// health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    hasToken: !!YANDEX_TOKEN,
    hasParkId: !!PARK_ID,
  });
});

function normalizePhone(p = "") {
  let s = String(p).trim().replace(/\s+/g, "");
  if (s.startsWith("995")) s = "+" + s;
  if (!s.startsWith("+") && s.length) s = "+" + s;
  return s;
}

app.get("/driver-by-phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone || "");
    if (!phone) return res.status(400).json({ error: "phone is required" });
    if (!YANDEX_TOKEN) return res.status(500).json({ error: "YANDEX_TOKEN missing" });
    if (!PARK_ID) return res.status(500).json({ error: "PARK_ID missing" });

    const response = await fetch(
      "https://fleet-api.taxi.yandex.net/v1/parks/contractors",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": YANDEX_TOKEN,
        },
        body: JSON.stringify({
          park_id: PARK_ID,
          filters: {
            phones: [phone],
          },
          limit: 1,
        }),
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from Yandex", raw: text });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Yandex API error",
        status: response.status,
        raw: data,
      });
    }

    const contractor =
      data?.contractors?.[0] ||
      data?.result?.contractors?.[0] ||
      null;

    if (!contractor) {
      return res.json({ success: true, found: false, phone });
    }

    return res.json({
      success: true,
      found: true,
      phone,
      contractor_id: contractor.id || contractor.contractor_id || null,
      name: contractor.name || contractor.person?.name || null,
      balance:
        contractor.balance ??
        contractor?.accounts?.[0]?.balance ??
        null,
    });
  } catch (e) {
    return res.status(500).json({ error: "server error", details: String(e) });
  }
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
