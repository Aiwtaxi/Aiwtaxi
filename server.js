import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));

const PORT = process.env.PORT || 3000;

const YANDEX_TOKEN = process.env.YANDEX_TOKEN; // X-API-Key
const PARK_ID = process.env.PARK_ID;

app.get("/", (req, res) => {
  res.json({ status: "ok", hasToken: !!YANDEX_TOKEN, hasParkId: !!PARK_ID });
});

async function fetchJson(url, options = {}) {
  const resp = await fetch(url, options);
  const text = await resp.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // არაა JSON
  }

  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      statusText: resp.statusText,
      raw: text,
      json,
    };
  }

  return { ok: true, status: resp.status, json, raw: text };
}

// ✅ აქ ვცდილობთ მოვძებნოთ balance ყველგან, სადაც ხშირად დევს
function extractBalance(driverObj) {
  if (!driverObj || typeof driverObj !== "object") return null;

  // 1) პირდაპირ
  if (typeof driverObj.balance === "number") return driverObj.balance;

  // 2) wallets / accounts
  const candidates = [
    driverObj.accounts,
    driverObj.wallets,
    driverObj.finances,
    driverObj.payment_accounts,
    driverObj.billing_accounts,
  ];

  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length) {
      // ეძებს პირველივე ელემენტში balance-ს
      for (const item of arr) {
        if (item && typeof item.balance === "number") return item.balance;
        if (item && typeof item.amount === "number") return item.amount;
        if (item && item.money && typeof item.money.amount === "number") return item.money.amount;
      }
    }
  }

  // 3) ზოგჯერ balance დევს nested ველში
  const deep =
    driverObj?.financial?.balance ??
    driverObj?.finance?.balance ??
    driverObj?.profile?.balance ??
    driverObj?.driver_profile?.balance;

  if (typeof deep === "number") return deep;

  return null;
}

// ✅ Driver by phone
app.get("/driver-by-phone", async (req, res) => {
  const phone = (req.query.phone || "").toString().trim();
  if (!phone) return res.status(400).json({ error: "phone is required" });
  if (!YANDEX_TOKEN) return res.status(500).json({ error: "YANDEX_TOKEN is missing in env" });
  if (!PARK_ID) return res.status(500).json({ error: "PARK_ID is missing in env" });

  // ⚠️ ეს endpoint შეიძლება განსხვავდებოდეს შენს იანდექსის API წვდომაზე
  // იდეა იგივეა: phone-ით ვეძებთ contractor/driver-ს
  const url = "https://fleet-api.taxi.yandex.net/v1/parks/contractors/list";

  const body = {
    park_id: PARK_ID,
    query: { phones: [phone] },
    limit: 1,
  };

  const result = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": YANDEX_TOKEN },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    return res.status(result.status).json({
      error: "Yandex request failed",
      status: result.status,
      statusText: result.statusText,
      yandexJson: result.json,
      yandexRaw: result.raw?.slice(0, 2000),
    });
  }

  const data = result.json;

  const driver =
    data?.contractors?.[0] ||
    data?.result?.contractors?.[0] ||
    data?.items?.[0] ||
    null;

  if (!driver) {
    return res.json({ success: true, found: false, phone, data });
  }

  const balance = extractBalance(driver);

  // სახელის ამოღება (თუ სხვადასხვა ველშია)
  const name =
    driver?.name ||
    driver?.person?.name ||
    driver?.profile?.name ||
    driver?.driver_profile?.name ||
    null;

  // ✅ მთავარ პასუხში ვაბრუნებთ მარტივად + rawDriver (რომ ზუსტად ვნახოთ სადაა balance)
  return res.json({
    success: true,
    found: true,
    phone,
    name,
    balance,          // თუ null გამოვიდა — ე.ი. ამ endpoint-ში არ მოდის
    rawDriver: driver // ამით ზუსტად დაინახავ სად დევს profile-ზე ნაჩვენები მონაცემი
  });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
