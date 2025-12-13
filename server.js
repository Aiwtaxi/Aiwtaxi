const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Aiwtaxi backend is running ✅");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "aiwtaxi-backend",
    hasToken: !!process.env.YANDEX_FLEET_TOKEN
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
