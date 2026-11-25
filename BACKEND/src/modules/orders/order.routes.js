const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderStats,
  getOrderByIdOrNumber,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  deleteOrder,
} = require("./order.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// Order Analytics (Defined before /:id)
router.get("/stats", protect, getOrderStats);

// Orders CRUD & Read
router.get("/", protect, getOrders);
router.get("/:id", protect, getOrderByIdOrNumber);
router.post("/", protect, createOrder);

// Status & Payment Updates
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/cancel", protect, cancelOrder);
router.patch("/:id/payment", protect, updatePaymentStatus);

// Delete Order (Admin only)
router.delete("/:id", protect, authorize("ADMIN"), deleteOrder);

module.exports = router;

