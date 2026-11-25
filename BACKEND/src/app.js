require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/categories", require("./modules/categories/category.routes"));
app.use("/api/products", require("./modules/products/product.routes"));
app.use("/api/inventory", require("./modules/inventory/inventory.routes"));
app.use("/api/orders", require("./modules/orders/order.routes"));
app.use("/api/dashboard", require("./modules/dashboard/dashboard.routes"));

// Root Health / Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory Management API is running",
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
