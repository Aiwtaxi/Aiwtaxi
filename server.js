import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Render ENV
const YANDEX_TOKEN = process.env.YANDEX_TOKEN; // X-API-Key
const PARK_ID = process.env.PARK_ID;

// root test
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    hasToken: Boolean(YANDEX_TOKEN),
    hasParkId: Boolean(PARK_ID),
  });
});

// phone normalize
function normalizePhone(phone = "") {
  let p = String(phone).trim().replace(/\s+/g, "");
  // allow 995xxxxxxxxx -> +995xxxxxxxxx
  if (p.startsWith("995")) p = "+" + p;
  // if starts with 0 (e.g. 0555...), you can optionally convert to +995
  // if (p.startsWith("0")) p = "+995" + p.slice(1);
  return p;
}

/**
 * FIND DRIVER BY PHONE (contractor)
 * GET /driver-by-phone?phone=+9955xxxxxxxx
 */
app.get("/driver-by-phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone || "");

    if (!phone) return res.status(400).json({ error: "phone is required" });
    if (!YANDEX_TOKEN) return res.status(500).json({ error: "YANDEX_TOKEN missing" });
    if (!PARK_ID) return res.status(500).json({ error: "PARK_ID missing" });

    const url = "https://fleet-api.taxi.yandex.net/v1/parks/contractors/list";

    const payload = {
      park_id: PARK_ID,
      query: {
        phones: [phone],
      },
      limit: 1,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": YANDEX_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from Yandex",
        raw: text.slice(0, 500),
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Yandex API error",
        status: response.status,
        raw: json,
      });
    }

    // Yandex sometimes returns either { contractors: [...] } or { result: { contractors: [...] } }
    const contractor =
      json?.contractors?.[0] ||
      json?.result?.contractors?.[0] ||
      null;

    if (!contractor) {
      return res.json({ success: true, found: false, phone });
    }

    const balance =
      contractor.balance ??
      contractor.accounts?.[0]?.balance ??
      null;

    return res.json({
      success: true,
      found: true,
      phone,
      contractor_id: contractor.id || null,
      name: contractor.name || null,
      balance,
      raw: contractor,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
