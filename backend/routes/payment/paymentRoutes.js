const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");
const {
  createPayment,
  getPayment,
  getUserPayments,
} = require("../../controllers/payment/paymentController");
const {
  getAdminPayments,
} = require("../../controllers/payment/adminPaymentController");
const refundPayment = require("../../controllers/payment/refundController");

const router = express.Router();

router.post("/create", authMiddleware, createPayment);
router.get("/my-payments", authMiddleware, getUserPayments);
router.get("/admin/payments", authMiddleware, adminMiddleware, getAdminPayments);
router.get("/:id", authMiddleware, getPayment);
router.post("/refund/:id", authMiddleware, adminMiddleware, refundPayment);

module.exports = router;