const dashboardService = require("./dashboard.service");

// Get Main Executive Overview
const getDashboardOverview = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardOverview();

    return res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard overview",
    });
  }
};

// Get Sales & Revenue Analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    const data = await dashboardService.getSalesAnalytics({
      period,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      message: "Sales analytics fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sales analytics",
    });
  }
};

// Get Inventory & Stock Analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    const data = await dashboardService.getInventoryAnalytics();

    return res.status(200).json({
      success: true,
      message: "Inventory analytics fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory analytics",
    });
  }
};

// Get Top Selling Products
const getTopSellingProducts = async (req, res) => {
  try {
    const { limit, days } = req.query;

    const data = await dashboardService.getTopSellingProducts({
      limit,
      days,
    });

    return res.status(200).json({
      success: true,
      message: "Top selling products fetched successfully",
      data: { products: data },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top selling products",
    });
  }
};

// Get Category Analytics
const getCategoryAnalytics = async (req, res) => {
  try {
    const data = await dashboardService.getCategoryAnalytics();

    return res.status(200).json({
      success: true,
      message: "Category analytics fetched successfully",
      data: { categories: data },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category analytics",
    });
  }
};

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getInventoryAnalytics,
  getTopSellingProducts,
  getCategoryAnalytics,
};

