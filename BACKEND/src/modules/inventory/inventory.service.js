const mongoose = require("mongoose");
const StockHistory = require("./stockHistory.model");
const Product = require("../products/product.model");
const Category = require("../categories/category.model");

// Helper: Resolve product by ObjectId, SKU, or Name
const resolveProduct = async (identifier) => {
  if (!identifier) return null;

  let idStr = identifier;
  if (typeof identifier === "object" && identifier !== null) {
    idStr = identifier._id || identifier.id || identifier.sku || identifier.name;
  }

  if (typeof idStr === "string") {
    idStr = idStr.trim();
  }

  if (!idStr) return null;

  // 1. By MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const byId = await Product.findById(idStr).populate("category", "name");
    if (byId) return byId;
  }

  // 2. By SKU
  const bySku = await Product.findOne({
    sku: idStr.toUpperCase(),
  }).populate("category", "name");
  if (bySku) return bySku;

  // 3. By Name (case-insensitive)
  const byName = await Product.findOne({
    name: { $regex: new RegExp(`^${idStr}$`, "i") },
  }).populate("category", "name");
  if (byName) return byName;

  return null;
};

// Adjust Stock (Single Item)
const adjustStock = async (
  { product, type, quantity, targetQuantity, reason, reference },
  userId
) => {
  const productDoc = await resolveProduct(product);
  if (!productDoc) {
    throw new Error(
      `Product '${typeof product === "object" ? JSON.stringify(product) : product}' not found. Please provide a valid product ID, SKU, or name.`
    );
  }

  const validTypes = ["IN", "OUT", "ADJUSTMENT", "RETURN", "DAMAGED"];
  const movementType = (type || "").toUpperCase().trim();
  if (!validTypes.includes(movementType)) {
    throw new Error(
      `Invalid movement type '${type}'. Valid types are: ${validTypes.join(", ")}`
    );
  }

  const previousStock = productDoc.quantity;
  let newStock;
  let movementQuantity;

  if (movementType === "IN" || movementType === "RETURN") {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number greater than 0");
    }
    movementQuantity = qty;
    newStock = previousStock + qty;
  } else if (movementType === "OUT" || movementType === "DAMAGED") {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error("Quantity must be a positive number greater than 0");
    }
    if (previousStock < qty) {
      throw new Error(
        `Insufficient stock for '${productDoc.name}'. Current stock is ${previousStock}, cannot deduct ${qty}.`
      );
    }
    movementQuantity = qty;
    newStock = previousStock - qty;
  } else if (movementType === "ADJUSTMENT") {
    if (targetQuantity !== undefined) {
      const target = Number(targetQuantity);
      if (isNaN(target) || target < 0) {
        throw new Error("Target quantity cannot be negative");
      }
      newStock = target;
      movementQuantity = Math.abs(newStock - previousStock);
    } else if (quantity !== undefined) {
      const delta = Number(quantity);
      if (isNaN(delta)) {
        throw new Error("Adjustment quantity must be a valid number");
      }
      if (previousStock + delta < 0) {
        throw new Error(
          `Insufficient stock. Current stock is ${previousStock}, adjustment would result in negative stock.`
        );
      }
      newStock = previousStock + delta;
      movementQuantity = Math.abs(delta);
    } else {
      throw new Error("Please provide either 'targetQuantity' or 'quantity' for ADJUSTMENT");
    }
  }

  // Update product stock
  productDoc.quantity = newStock;
  await productDoc.save();

  // Create Stock History Log
  const stockLog = await StockHistory.create({
    product: productDoc._id,
    type: movementType,
    quantity: movementQuantity,
    previousStock,
    newStock,
    reason: reason ? reason.trim() : `Stock ${movementType.toLowerCase()}`,
    reference: reference ? reference.trim() : "",
    performedBy: userId || null,
  });

  const populatedLog = await StockHistory.findById(stockLog._id)
    .populate("product", "name sku unit")
    .populate("performedBy", "name email role");

  return {
    product: {
      id: productDoc._id,
      name: productDoc.name,
      sku: productDoc.sku,
      unit: productDoc.unit,
      previousStock,
      currentStock: productDoc.quantity,
      lowStockThreshold: productDoc.lowStockThreshold,
      isLowStock: productDoc.quantity <= productDoc.lowStockThreshold,
      isOutOfStock: productDoc.quantity === 0,
    },
    movement: populatedLog,
  };
};

// Bulk Stock Adjustment
const bulkAdjustStock = async (items, userId) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required and cannot be empty");
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const result = await adjustStock(item, userId);
      results.push(result);
    } catch (err) {
      errors.push({
        index: i,
        product: item.product,
        error: err.message,
      });
    }
  }

  return {
    totalRequested: items.length,
    successfulCount: results.length,
    failedCount: errors.length,
    successful: results,
    errors,
  };
};

// Get Overall Inventory Summary / KPI Overview
const getInventorySummary = async () => {
  const [totalProducts, stockStats, alertsCount, categoryAgg] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStockUnits: { $sum: "$quantity" },
          totalSellingValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalCostValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        },
      },
    ]),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          outOfStock: {
            $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
          },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", "$lowStockThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          inStock: {
            $sum: {
              $cond: [{ $gt: ["$quantity", "$lowStockThreshold"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          stockUnits: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          categoryId: "$_id",
          categoryName: { $ifNull: ["$categoryDetails.name", "Uncategorized"] },
          productCount: 1,
          stockUnits: 1,
          totalValue: { $round: ["$totalValue", 2] },
        },
      },
    ]),
  ]);

  const stats = stockStats[0] || {
    totalStockUnits: 0,
    totalSellingValue: 0,
    totalCostValue: 0,
  };

  const alertStats = alertsCount[0] || {
    outOfStock: 0,
    lowStock: 0,
    inStock: 0,
  };

  const potentialProfit = stats.totalSellingValue - stats.totalCostValue;

  return {
    totalProducts,
    totalStockUnits: stats.totalStockUnits,
    totalSellingValue: Math.round(stats.totalSellingValue * 100) / 100,
    totalCostValue: Math.round(stats.totalCostValue * 100) / 100,
    estimatedProfitMargin:
      stats.totalSellingValue > 0
        ? Math.round((potentialProfit / stats.totalSellingValue) * 10000) / 100
        : 0,
    stockStatusCounts: {
      inStock: alertStats.inStock,
      lowStock: alertStats.lowStock,
      outOfStock: alertStats.outOfStock,
    },
    categoryBreakdown: categoryAgg,
  };
};

// Get Inventory Levels (with status calculation and filters)
const getInventoryLevels = async ({
  page = 1,
  limit = 10,
  search = "",
  category,
  status,
  sortBy = "quantity",
  sortOrder = "asc",
}) => {
  const query = { isActive: true };

  // Search by name or SKU
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { sku: regex }];
  }

  // Category filter
  if (category && category.trim()) {
    if (mongoose.Types.ObjectId.isValid(category.trim())) {
      query.category = category.trim();
    } else {
      const cat = await Category.findOne({
        name: { $regex: new RegExp(`^${category.trim()}$`, "i") },
      });
      if (cat) query.category = cat._id;
    }
  }

  // Status filter: OUT_OF_STOCK, LOW_STOCK, IN_STOCK
  if (status) {
    const upperStatus = status.toUpperCase().trim();
    if (upperStatus === "OUT_OF_STOCK") {
      query.quantity = 0;
    } else if (upperStatus === "LOW_STOCK") {
      query.$expr = {
        $and: [
          { $gt: ["$quantity", 0] },
          { $lte: ["$quantity", "$lowStockThreshold"] },
        ],
      };
    } else if (upperStatus === "IN_STOCK") {
      query.$expr = { $gt: ["$quantity", "$lowStockThreshold"] };
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const validSortFields = ["name", "sku", "quantity", "price", "createdAt"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "quantity";
  const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  const items = products.map((prod) => {
    let stockStatus = "IN_STOCK";
    if (prod.quantity === 0) {
      stockStatus = "OUT_OF_STOCK";
    } else if (prod.quantity <= prod.lowStockThreshold) {
      stockStatus = "LOW_STOCK";
    }

    return {
      id: prod._id,
      name: prod.name,
      sku: prod.sku,
      category: prod.category ? prod.category.name : "Uncategorized",
      price: prod.price,
      costPrice: prod.costPrice,
      quantity: prod.quantity,
      unit: prod.unit,
      lowStockThreshold: prod.lowStockThreshold,
      stockStatus,
      stockValue: Math.round(prod.quantity * prod.price * 100) / 100,
    };
  });

  return {
    inventory: items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    },
  };
};

// Get Stock Movement History / Audit Log
const getStockHistory = async ({
  page = 1,
  limit = 10,
  product,
  type,
  startDate,
  endDate,
  performedBy,
}) => {
  const query = {};

  if (product && product.trim()) {
    const prodDoc = await resolveProduct(product);
    if (prodDoc) {
      query.product = prodDoc._id;
    } else if (mongoose.Types.ObjectId.isValid(product.trim())) {
      query.product = product.trim();
    }
  }

  if (type && type.trim()) {
    query.type = type.toUpperCase().trim();
  }

  if (performedBy && mongoose.Types.ObjectId.isValid(performedBy.trim())) {
    query.performedBy = performedBy.trim();
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const [history, total] = await Promise.all([
    StockHistory.find(query)
      .populate("product", "name sku unit price")
      .populate("performedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    StockHistory.countDocuments(query),
  ]);

  return {
    history,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    },
  };
};

// Get Stock History for a specific product
const getProductStockHistory = async (productId, { page = 1, limit = 10 }) => {
  const prodDoc = await resolveProduct(productId);
  if (!prodDoc) {
    throw new Error("Product not found");
  }

  return await getStockHistory({
    page,
    limit,
    product: prodDoc._id.toString(),
  });
};

// Get Low Stock & Out of Stock Alerts
const getInventoryAlerts = async () => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
  })
    .populate("category", "name")
    .sort({ quantity: 1 });

  const alerts = products.map((prod) => {
    const isOut = prod.quantity === 0;
    return {
      id: prod._id,
      name: prod.name,
      sku: prod.sku,
      category: prod.category ? prod.category.name : "Uncategorized",
      quantity: prod.quantity,
      unit: prod.unit,
      lowStockThreshold: prod.lowStockThreshold,
      deficit: Math.max(0, prod.lowStockThreshold - prod.quantity),
      severity: isOut ? "CRITICAL" : "WARNING",
      status: isOut ? "OUT_OF_STOCK" : "LOW_STOCK",
    };
  });

  return {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
    warningCount: alerts.filter((a) => a.severity === "WARNING").length,
    alerts,
  };
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

