const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getLowStockProducts,
  getProductByIdOrSku,
  updateProduct,
  updateStock,
  toggleProductStatus,
  deleteProduct,
} = require("./product.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// Read routes (Accessible by both STAFF and ADMIN)
router.get("/", protect, getProducts);
router.get("/low-stock", protect, getLowStockProducts);
router.get("/:id", protect, getProductByIdOrSku);

// Stock adjustment route (Accessible by authenticated STAFF and ADMIN)
router.patch("/:id/stock", protect, updateStock);

// Admin-only management routes
router.post("/", protect, authorize("ADMIN"), createProduct);
router.put("/:id", protect, authorize("ADMIN"), updateProduct);
router.patch("/:id/toggle-status", protect, authorize("ADMIN"), toggleProductStatus);
router.delete("/:id", protect, authorize("ADMIN"), deleteProduct);

module.exports = router;

