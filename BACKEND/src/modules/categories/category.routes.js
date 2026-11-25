const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("./category.controller");

const { protect } = require("../../middlewares/auth.middleware");
const { authorize } = require("../../middlewares/role.middleware");

// Authenticated Routes (Accessible by both STAFF and ADMIN)
router.get("/", protect, getCategories);
router.get("/:id", protect, getCategoryById);

// Admin-Only Routes
router.post("/", protect, authorize("ADMIN"), createCategory);
router.put("/:id", protect, authorize("ADMIN"), updateCategory);
router.delete("/:id", protect, authorize("ADMIN"), deleteCategory);
router.patch("/:id/toggle-status", protect, authorize("ADMIN"), toggleCategoryStatus);

module.exports = router;

