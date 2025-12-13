import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YANDEX_TOKEN = process.env.YANDEX_TOKEN; // X-API-Key
const PARK_ID = process.env.PARK_ID;

app.get("/", (req, res) => {
  res.json({ status: "ok", hasToken: !!YANDEX_TOKEN, hasParkId: !!PARK_ID });
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
    // Fleet API call (contractors list with phone filter)
    const url = "https://fleet-api.taxi.yandex.net/v1/parks/contractors/list";

    const r = await fetch(url, {
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
    });

    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}

    if (!r.ok) {
      return res.status(r.status).json({
        error: "Yandex Fleet API error",
        status: r.status,
        yandexJson: data,
        yandexRaw: text.slice(0, 2000),
      });
    }

    const contractor =
      data?.contractors?.[0] ||
      data?.result?.contractors?.[0] ||
      data?.items?.[0] ||
      null;

    if (!contractor) {
      return res.json({ success: true, found: false, phone, data });
    }

    // აქაა იდეა: თუ Fleet API აბრუნებს balance-ს, ავიღებთ.
    const balance =
      contractor.balance ??
      contractor?.accounts?.[0]?.balance ??
      contractor?.wallet?.balance ??
      null;

    return res.json({
      success: true,
      found: true,
      phone,
      contractor_id: contractor.id || contractor.contractor_id || null,
      name: contractor.name || contractor.person?.name || null,
      balance,
      rawContractor: contractor,
    });
  } catch (e) {
    return res.status(500).json({ error: "server error", details: String(e) });
  }
});

app.listen(PORT, () => console.log("Server running on", PORT));
