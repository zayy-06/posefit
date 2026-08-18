const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth/authRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const paymentRoutes = require("./routes/payment/paymentRoutes");
const professionalRoutes = require("./routes/professional/professionalRoutes");
const uploadRoutes = require("./routes/upload/uploadRoutes");
const stripeWebhook = require("./controllers/payment/stripeWebhookController");
const ConnectToDB = require("./models/db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/professional", professionalRoutes);
app.use("/api/upload", uploadRoutes);

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