const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// TEST ENDPOINT
app.get("/", (req, res) => {
  res.json({ status: "ok", hasToken: true });
});

// DRIVER BY PHONE
app.get("/driver-by-phone", (req, res) => {
  const phone = req.query.phone;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: "phone is required",
    });
  }

  if (phone === "+995598904878") {
    return res.json({
      success: true,
      driver: {
        name: "Aleksandre Nikolashvili",
        phone,
        balance: 105,
        status: "active",
      },
    });
  }

  return res.json({
    success: false,
    message: "Driver not found",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
