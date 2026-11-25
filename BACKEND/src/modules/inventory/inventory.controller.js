const inventoryService = require("./inventory.service");

// Adjust Stock (Single)
const adjustStock = async (req, res) => {
  try {
    const { product, type, quantity, targetQuantity, reason, reference } =
      req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product ID, SKU, or name is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message:
          "Movement type is required (IN, OUT, ADJUSTMENT, RETURN, DAMAGED)",
      });
    }

    const result = await inventoryService.adjustStock(
      {
        product,
        type,
        quantity,
        targetQuantity,
        reason,
        reference,
      },
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      data: result,
    });
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Product not found")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("Insufficient stock") ||
      error.message.includes("Invalid movement type") ||
      error.message.includes("Quantity must be") ||
      error.message.includes("Target quantity") ||
      error.message.includes("Please provide")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to adjust stock",
    });
  }
};

// Bulk Stock Adjustment
const bulkAdjustStock = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An 'items' array with at least one stock adjustment is required",
      });
    }

    const result = await inventoryService.bulkAdjustStock(items, req.user?._id);

    return res.status(200).json({
      success: true,
      message: `Bulk adjustment completed: ${result.successfulCount} succeeded, ${result.failedCount} failed`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to perform bulk stock adjustment",
    });
  }
};

// Get Inventory Summary (KPIs, Total Value, Status Counts)
const getInventorySummary = async (req, res) => {
  try {
    const summary = await inventoryService.getInventorySummary();

    return res.status(200).json({
      success: true,
      message: "Inventory summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory summary",
    });
  }
};

// Get Inventory Levels / Current Stock
const getInventoryLevels = async (req, res) => {
  try {
    const { page, limit, search, category, status, sortBy, sortOrder } =
      req.query;

    const result = await inventoryService.getInventoryLevels({
      page,
      limit,
      search,
      category,
      status,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory levels fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory levels",
    });
  }
};

// Get Stock Movement History / Audit Log
const getStockHistory = async (req, res) => {
  try {
    const { page, limit, product, type, startDate, endDate, performedBy } =
      req.query;

    const result = await inventoryService.getStockHistory({
      page,
      limit,
      product,
      type,
      startDate,
      endDate,
      performedBy,
    });

    return res.status(200).json({
      success: true,
      message: "Stock movement history fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stock history",
    });
  }
};

// Get Stock History for a Specific Product
const getProductStockHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit } = req.query;

    const result = await inventoryService.getProductStockHistory(productId, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Product stock history fetched successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product stock history",
    });
  }
};

// Get Low Stock & Out of Stock Alerts
const getInventoryAlerts = async (req, res) => {
  try {
    const result = await inventoryService.getInventoryAlerts();

    return res.status(200).json({
      success: true,
      message: "Inventory alerts fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory alerts",
    });
  }
};

module.exports = {
  adjustStock,
  bulkAdjustStock,
  getInventorySummary,
  getInventoryLevels,
  getStockHistory,
  getProductStockHistory,
  getInventoryAlerts,
};

