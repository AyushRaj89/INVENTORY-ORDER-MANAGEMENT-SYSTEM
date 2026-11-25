const express = require("express");
const router = express.Router();

const {
  adjustStock,
  bulkAdjustStock,
  getInventorySummary,
  getInventoryLevels,
  getStockHistory,
  getProductStockHistory,
  getInventoryAlerts,
} = require("./inventory.controller");

const { protect } = require("../../middlewares/auth.middleware");

// Inventory Reports & Analytics
router.get("/summary", protect, getInventorySummary);
router.get("/levels", protect, getInventoryLevels);
router.get("/alerts", protect, getInventoryAlerts);
router.get("/history", protect, getStockHistory);
router.get("/history/:productId", protect, getProductStockHistory);

// Root inventory listing (alias to levels)
router.get("/", protect, getInventoryLevels);

// Stock Movement Actions
router.post("/adjust", protect, adjustStock);
router.post("/bulk-adjust", protect, bulkAdjustStock);

module.exports = router;

