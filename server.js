import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * TEST endpoint
 */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

/**
 * DRIVER BY PHONE
 * URL: /driver-by-phone?phone=+9955...
 */
app.get("/driver-by-phone", (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({
      error: "Phone parameter is required",
    });
  }

  // დროებითი პასუხი (ტესტისთვის)
  return res.json({
    status: "ok",
    phone,
    driver: {
      name: "Test Driver",
      balance: 105,
      active: true,
    },
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
