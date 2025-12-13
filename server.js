import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const YANDEX_TOKEN = process.env.YANDEX_TOKEN;
const PARK_ID = "taxi/park/3570960d7c3f4a4eb189bed587fc54d7"; // შენი park_id

app.get("/", (req, res) => {
  res.json({ status: "aiw taxi backend running" });
});

/**
 * მძღოლის მოძებნა ტელეფონის ნომრით
 * მაგალითი:
 * /driver-by-phone?phone=+995571222667
 */
app.get("/driver-by-phone", async (req, res) => {
  const phone = req.query.phone;

  if (!phone) {
    return res.status(400).json({ error: "phone is required" });
  }

  try {
    const response = await fetch(
      "https://fleet-api.taxi.yandex.net/v1/parks/driver-profiles/list",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${YANDEX_TOKEN}`,
        },
        body: JSON.stringify({
          park_id: PARK_ID,
          fields: {
            driver_profile: [
              "id",
              "first_name",
              "last_name",
              "phones"
            ],
          },
          query: {
            phones: [phone],
          },
          limit: 1,
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
  console.log("Server running on port", PORT);
});
