const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth/authRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const paymentRoutes = require("./routes/payment/paymentRoutes");
const stripeWebhook = require("./controllers/payment/stripeWebhookController");
const ConnectToDB = require("./models/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;



app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoseFit Backend API is running",
  });
});


const startServer = async () => {
  try {
    await ConnectToDB();

    app.listen(PORT, () => {
      console.log(`PoseFit Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();