import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Root endpoint
app.get("/", (req, res) => {
  res.send("aiw taxi backend running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    hasToken: Boolean(process.env.YANDEX_TOKEN),
  });
});

// Test endpoint for Yandex token
app.get("/api/yandex/test", (req, res) => {
  if (!process.env.YANDEX_TOKEN) {
    return res.json({
      ok: false,
      error: "YANDEX_TOKEN missing",
    });
  }

  res.json({
    ok: true,
    message: "Yandex token detected",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚕 AIW Taxi backend running on port ${PORT}`);
});
