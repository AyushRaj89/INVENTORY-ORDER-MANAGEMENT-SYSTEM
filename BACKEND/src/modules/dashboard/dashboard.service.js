const mongoose = require("mongoose");
const Product = require("../products/product.model");
const Category = require("../categories/category.model");
const Order = require("../orders/order.model");
const StockHistory = require("../inventory/stockHistory.model");
const User = require("../users/users.model");

// Get Main Dashboard Executive Overview
const getDashboardOverview = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    categoryCount,
    userCount,
    inventoryStats,
    orderStats,
    todayOrderStats,
    monthOrderStats,
    recentOrders,
    recentMovements,
    topProductsAgg,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Category.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true }),
    // Inventory KPIs
    Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStockUnits: { $sum: "$quantity" },
          totalSellingValue: { $sum: { $multiply: ["$quantity", "$price"] } },
          totalCostValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
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
    // Overall Orders & Revenue
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "PENDING"] }, 1, 0],
            },
          },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "COMPLETED"] }, 1, 0],
            },
          },
        },
      },
    ]),
    // Today's Performance
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: 1 },
          todayRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
            },
          },
        },
      },
    ]),
    // Current Month's Performance
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          monthOrders: { $sum: 1 },
          monthRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
            },
          },
        },
      },
    ]),
    // 5 Recent Orders
    Order.find()
      .select("orderNumber customer.name finalAmount paymentStatus orderStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    // 5 Recent Stock Movements
    StockHistory.find()
      .populate("product", "name sku unit")
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5),
    // Top 5 Selling Products
    Order.aggregate([
      { $match: { orderStatus: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          sku: { $first: "$items.sku" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const inv = inventoryStats[0] || {
    totalStockUnits: 0,
    totalSellingValue: 0,
    totalCostValue: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const orders = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  };

  const today = todayOrderStats[0] || { todayOrders: 0, todayRevenue: 0 };
  const month = monthOrderStats[0] || { monthOrders: 0, monthRevenue: 0 };

  return {
    kpis: {
      totalRevenue: Math.round(orders.totalRevenue * 100) / 100,
      totalOrders: orders.totalOrders,
      totalProducts: productCount,
      totalCategories: categoryCount,
      totalUsers: userCount,
      totalStockUnits: inv.totalStockUnits,
      inventorySellingValue: Math.round(inv.totalSellingValue * 100) / 100,
      inventoryCostValue: Math.round(inv.totalCostValue * 100) / 100,
    },
    today: {
      orders: today.todayOrders,
      revenue: Math.round(today.todayRevenue * 100) / 100,
    },
    thisMonth: {
      orders: month.monthOrders,
      revenue: Math.round(month.monthRevenue * 100) / 100,
    },
    inventoryHealth: {
      inStock: inv.inStock,
      lowStock: inv.lowStock,
      outOfStock: inv.outOfStock,
      requiresAttentionCount: inv.lowStock + inv.outOfStock,
    },
    recentOrders,
    recentStockMovements: recentMovements,
    topSellingProducts: topProductsAgg.map((p) => ({
      productId: p._id,
      name: p.name,
      sku: p.sku,
      unitsSold: p.unitsSold,
      revenue: Math.round(p.revenue * 100) / 100,
    })),
  };
};

// Sales & Revenue Analytics (Trends, payment methods, order status)
const getSalesAnalytics = async ({
  period = "daily",
  startDate,
  endDate,
}) => {
  const matchStage = {};

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    matchStage.createdAt = { $gte: thirtyDaysAgo };
  }

  // Format date grouping string based on period
  let dateFormat = "%Y-%m-%d"; // default daily
  if (period === "monthly") {
    dateFormat = "%Y-%m";
  } else if (period === "yearly") {
    dateFormat = "%Y";
  }

  const [timelineTrends, paymentMethodDist, orderStatusDist] = await Promise.all([
    Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
            },
          },
          grossAmount: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$finalAmount" },
        },
      },
    ]),
    Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    timeline: timelineTrends.map((t) => ({
      date: t._id,
      orders: t.totalOrders,
      revenue: Math.round(t.paidRevenue * 100) / 100,
      grossAmount: Math.round(t.grossAmount * 100) / 100,
      averageOrderValue: Math.round(t.averageOrderValue * 100) / 100,
    })),
    paymentMethods: paymentMethodDist.map((p) => ({
      method: p._id,
      count: p.count,
      amount: Math.round(p.amount * 100) / 100,
    })),
    orderStatuses: orderStatusDist.map((s) => ({
      status: s._id,
      count: s.count,
    })),
  };
};

// Inventory & Stock Health Analytics
const getInventoryAnalytics = async () => {
  const [categoryBreakdown, stockHealth, movementSummary, criticalAlerts] =
    await Promise.all([
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            productCount: { $sum: 1 },
            stockUnits: { $sum: "$quantity" },
            totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
            totalCost: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
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
            name: { $ifNull: ["$categoryDetails.name", "Uncategorized"] },
            productCount: 1,
            stockUnits: 1,
            totalValue: { $round: ["$totalValue", 2] },
            totalCost: { $round: ["$totalCost", 2] },
          },
        },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            inStock: {
              $sum: {
                $cond: [{ $gt: ["$quantity", "$lowStockThreshold"] }, 1, 0],
              },
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
            outOfStock: {
              $sum: { $cond: [{ $eq: ["$quantity", 0] }, 1, 0] },
            },
          },
        },
      ]),
      StockHistory.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            totalUnits: { $sum: "$quantity" },
          },
        },
      ]),
      Product.find({
        isActive: true,
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      })
        .populate("category", "name")
        .sort({ quantity: 1 })
        .limit(10),
    ]);

  const health = stockHealth[0] || {
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  const total = health.totalProducts || 1;

  return {
    stockDistribution: {
      inStock: {
        count: health.inStock,
        percentage: Math.round((health.inStock / total) * 1000) / 10,
      },
      lowStock: {
        count: health.lowStock,
        percentage: Math.round((health.lowStock / total) * 1000) / 10,
      },
      outOfStock: {
        count: health.outOfStock,
        percentage: Math.round((health.outOfStock / total) * 1000) / 10,
      },
    },
    categoryBreakdown,
    movementTypeSummary: movementSummary.map((m) => ({
      type: m._id,
      movementCount: m.count,
      totalUnits: m.totalUnits,
    })),
    criticalLowStockItems: criticalAlerts.map((p) => ({
      id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category ? p.category.name : "Uncategorized",
      quantity: p.quantity,
      unit: p.unit,
      lowStockThreshold: p.lowStockThreshold,
      deficit: Math.max(0, p.lowStockThreshold - p.quantity),
      status: p.quantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
    })),
  };
};

// Top Selling Products with details
const getTopSellingProducts = async ({ limit = 10, days = 30 }) => {
  const matchStage = { orderStatus: { $ne: "CANCELLED" } };

  if (days && !isNaN(Number(days))) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));
    matchStage.createdAt = { $gte: fromDate };
  }

  const top = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        sku: { $first: "$items.sku" },
        unitsSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: Number(limit) || 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    {
      $unwind: {
        path: "$productDoc",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        productId: "$_id",
        name: 1,
        sku: 1,
        unitsSold: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
        orderCount: 1,
        currentStock: "$productDoc.quantity",
        price: "$productDoc.price",
        unit: "$productDoc.unit",
      },
    },
  ]);

  return top;
};

// Category Performance & Revenue Analytics
const getCategoryAnalytics = async () => {
  const [categories, categorySales] = await Promise.all([
    Category.find({ isActive: true }).select("name description"),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "CANCELLED" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$productDetails.category",
          totalRevenue: { $sum: "$items.subtotal" },
          unitsSold: { $sum: "$items.quantity" },
          orderItemCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const salesMap = {};
  categorySales.forEach((s) => {
    if (s._id) salesMap[s._id.toString()] = s;
  });

  const productCounts = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$category",
        productCount: { $sum: 1 },
        stockUnits: { $sum: "$quantity" },
        inventoryValue: { $sum: { $multiply: ["$quantity", "$price"] } },
      },
    },
  ]);

  const productMap = {};
  productCounts.forEach((p) => {
    if (p._id) productMap[p._id.toString()] = p;
  });

  const result = categories.map((cat) => {
    const pInfo = productMap[cat._id.toString()] || {
      productCount: 0,
      stockUnits: 0,
      inventoryValue: 0,
    };
    const sInfo = salesMap[cat._id.toString()] || {
      totalRevenue: 0,
      unitsSold: 0,
      orderItemCount: 0,
    };

    return {
      categoryId: cat._id,
      categoryName: cat.name,
      description: cat.description,
      productCount: pInfo.productCount,
      stockUnits: pInfo.stockUnits,
      inventoryValue: Math.round(pInfo.inventoryValue * 100) / 100,
      unitsSold: sInfo.unitsSold,
      totalRevenue: Math.round(sInfo.totalRevenue * 100) / 100,
    };
  });

  return result;
};

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getTopSellingProducts,
  getCategoryAnalytics,
};

