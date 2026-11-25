const productService = require("./product.service");

// Create Product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      price,
      costPrice,
      quantity,
      lowStockThreshold,
      unit,
      imageUrl,
      isActive,
    } = req.body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Product category is required",
      });
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number or zero",
      });
    }

    if (costPrice !== undefined && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be a valid positive number or zero",
      });
    }

    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid positive number or zero",
      });
    }

    const product = await productService.createProduct(
      {
        name,
        sku,
        description,
        category,
        price,
        costPrice,
        quantity,
        lowStockThreshold,
        unit,
        imageUrl,
        isActive,
      },
      req.user?._id
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    if (
      error.message === "Product with this SKU already exists" ||
      error.message.includes("does not exist") ||
      error.message.includes("category ID format")
    ) {
      const statusCode =
        error.message === "Product with this SKU already exists" ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

// Get All Products
const getProducts = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      isActive,
      isLowStock,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await productService.getAllProducts({
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      isActive,
      isLowStock,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

// Get Low Stock Products Alert List
const getLowStockProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await productService.getLowStockProducts({ page, limit });

    return res.status(200).json({
      success: true,
      message: "Low stock products fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch low stock products",
    });
  }
};

// Get Product by ID or SKU
const getProductByIdOrSku = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductByIdOrSku(id);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: { product },
    });
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.updateProduct(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  } catch (error) {
    if (
      error.message === "Invalid product ID format" ||
      error.message.includes("category ID format") ||
      error.message.includes("does not exist")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product with this SKU already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

// Update Product Stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, change, operation } = req.body;

    const result = await productService.updateStock(id, {
      quantity,
      change,
      operation,
    });

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: result,
    });
  } catch (error) {
    if (
      error.message === "Invalid product ID format" ||
      error.message.includes("Quantity must be") ||
      error.message.includes("Stock change value") ||
      error.message.includes("Please provide either") ||
      error.message.includes("Insufficient stock")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update stock",
    });
  }
};

// Toggle Product Active Status
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.toggleProductStatus(id);

    return res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: { product },
    });
  } catch (error) {
    if (error.message === "Invalid product ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle product status",
    });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productService.deleteProduct(id);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Invalid product ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockProducts,
  getProductByIdOrSku,
  updateProduct,
  updateStock,
  toggleProductStatus,
  deleteProduct,
};

