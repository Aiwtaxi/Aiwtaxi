export default async function handler(req, res) {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: "Phone missing" });
  }

  const PARK_ID = "3570960d7c3f4a4eb189bed587fc54d7";
  const API_KEY = "tlQGatuaTrXFLehrGJOxzcbumRtmyNaKjdvH";

  try {
    const ya = await fetch(
      "https://fleet-api.taxi.yandex.net/v1/parks/contractors/profile",
      {
        method: "POST",
        headers: {
          "X-Api-Key": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          park_id: PARK_ID,
          filter: { phone }
        })
      }
    );

    const data = await ya.json();

    if (!data.contractors || data.contractors.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const driver = data.contractors[0];
    const cashless = driver.balances?.cashless || 0;

    res.status(200).json({
      phone,
      balance: cashless
    });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
