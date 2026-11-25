const express = require("express");
const router = express.Router();

const {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getTopSellingProducts,
  getCategoryAnalytics,
} = require("./dashboard.controller");

const { protect } = require("../../middlewares/auth.middleware");

// Dashboard & Analytics endpoints (Authenticated users)
router.get("/overview", protect, getDashboardOverview);
router.get("/sales", protect, getSalesAnalytics);
router.get("/inventory", protect, getInventoryAnalytics);
router.get("/top-products", protect, getTopSellingProducts);
router.get("/categories", protect, getCategoryAnalytics);

// Alias root to overview
router.get("/", protect, getDashboardOverview);

module.exports = router;

