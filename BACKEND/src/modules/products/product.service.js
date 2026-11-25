const mongoose = require("mongoose");
const Product = require("./product.model");
const Category = require("../categories/category.model");

// Helper: Generate unique SKU
const generateSku = (name) => {
  const prefix =
    (name ? name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase() : "PRD") || "PRD";
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Helper: Resolve category by either ObjectId, Object with _id/id/name, or Category Name (case-insensitive)
const resolveCategory = async (categoryInput) => {
  if (!categoryInput) return null;

  let identifier = categoryInput;
  if (typeof categoryInput === "object" && categoryInput !== null) {
    identifier = categoryInput._id || categoryInput.id || categoryInput.name;
  }

  if (typeof identifier === "string") {
    identifier = identifier.trim();
  }

  if (!identifier) return null;

  // 1. Try finding by MongoDB ObjectId if valid format
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const foundById = await Category.findById(identifier);
    if (foundById) return foundById;
  }

  // 2. Try finding by category name (case-insensitive exact match)
  if (typeof identifier === "string") {
    const foundByName = await Category.findOne({
      name: { $regex: new RegExp(`^${identifier}$`, "i") },
    });
    if (foundByName) return foundByName;

    // 3. Try finding by partial word match (e.g. "electronic" vs "Electronics")
    const foundByPartial = await Category.findOne({
      name: { $regex: new RegExp(identifier, "i") },
    });
    if (foundByPartial) return foundByPartial;
  }

  return null;
};

// Create Product
const createProduct = async (productData, userId) => {
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
  } = productData;

  // Resolve category by ID or Name
  const categoryDoc = await resolveCategory(category);
  if (!categoryDoc) {
    const catName = typeof category === "object" ? JSON.stringify(category) : category;
    throw new Error(
      `Category '${catName}' does not exist. Please create it first via POST /api/categories or verify the ID/name.`
    );
  }

  // Handle SKU
  let finalSku = sku ? sku.trim().toUpperCase() : generateSku(name);

  const existingSku = await Product.findOne({ sku: finalSku });
  if (existingSku) {
    throw new Error("Product with this SKU already exists");
  }

  const product = await Product.create({
    name: name.trim(),
    sku: finalSku,
    description: description ? description.trim() : "",
    category: categoryDoc._id,
    price: Number(price),
    costPrice: costPrice !== undefined ? Number(costPrice) : 0,
    quantity: quantity !== undefined ? Number(quantity) : 0,
    lowStockThreshold:
      lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
    unit: unit ? unit.trim() : "pcs",
    imageUrl: imageUrl ? imageUrl.trim() : "",
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdBy: userId || null,
  });

  return await Product.findById(product._id)
    .populate("category", "name description")
    .populate("createdBy", "name email role");
};

// Get All Products (with search, category, price filter, pagination, sorting)
const getAllProducts = async ({
  page = 1,
  limit = 10,
  search = "",
  category,
  minPrice,
  maxPrice,
  isActive,
  isLowStock,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const query = {};

  // Search keyword in name, SKU, or description
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ name: searchRegex }, { sku: searchRegex }, { description: searchRegex }];
  }

  // Filter by category (supports ObjectId or Category Name)
  if (category && (typeof category === "string" ? category.trim() : category)) {
    const resolvedCat = await resolveCategory(category);
    if (resolvedCat) {
      query.category = resolvedCat._id;
    } else if (mongoose.Types.ObjectId.isValid(category.toString().trim())) {
      query.category = category.toString().trim();
    } else {
      query.category = new mongoose.Types.ObjectId();
    }
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      query.price.$lte = Number(maxPrice);
    }
  }

  // Filter by active status
  if (isActive !== undefined && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  // Filter low stock products
  if (isLowStock === "true" || isLowStock === true) {
    query.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const validSortFields = [
    "name",
    "price",
    "costPrice",
    "quantity",
    "sku",
    "createdAt",
    "updatedAt",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name description")
      .populate("createdBy", "name email role")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  return {
    products,
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

// Get Low Stock Products
const getLowStockProducts = async ({ page = 1, limit = 10 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {
    isActive: true,
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
  };

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name")
      .populate("createdBy", "name email")
      .sort({ quantity: 1 })
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  return {
    products,
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

// Get Product by ID or SKU
const getProductByIdOrSku = async (identifier) => {
  let query;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = {
      $or: [{ _id: identifier }, { sku: identifier.toUpperCase() }],
    };
  } else {
    query = { sku: identifier.toUpperCase() };
  }

  const product = await Product.findOne(query)
    .populate("category", "name description")
    .populate("createdBy", "name email role");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

// Update Product
const updateProduct = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  // Validate and resolve category if provided
  if (updateData.category) {
    const categoryDoc = await resolveCategory(updateData.category);
    if (!categoryDoc) {
      const catName = typeof updateData.category === "object" ? JSON.stringify(updateData.category) : updateData.category;
      throw new Error(
        `Category '${catName}' does not exist. Please create it first via POST /api/categories or verify the ID/name.`
      );
    }
    product.category = categoryDoc._id;
  }

  // Check SKU uniqueness if changed
  if (
    updateData.sku &&
    updateData.sku.trim().toUpperCase() !== product.sku
  ) {
    const existingSku = await Product.findOne({
      sku: updateData.sku.trim().toUpperCase(),
      _id: { $ne: id },
    });
    if (existingSku) {
      throw new Error("Product with this SKU already exists");
    }
    product.sku = updateData.sku.trim().toUpperCase();
  }

  if (updateData.name !== undefined) product.name = updateData.name.trim();
  if (updateData.description !== undefined)
    product.description = updateData.description.trim();
  if (updateData.price !== undefined) product.price = Number(updateData.price);
  if (updateData.costPrice !== undefined)
    product.costPrice = Number(updateData.costPrice);
  if (updateData.quantity !== undefined)
    product.quantity = Number(updateData.quantity);
  if (updateData.lowStockThreshold !== undefined)
    product.lowStockThreshold = Number(updateData.lowStockThreshold);
  if (updateData.unit !== undefined) product.unit = updateData.unit.trim();
  if (updateData.imageUrl !== undefined)
    product.imageUrl = updateData.imageUrl.trim();
  if (updateData.isActive !== undefined)
    product.isActive = Boolean(updateData.isActive);

  await product.save();

  return await Product.findById(id)
    .populate("category", "name description")
    .populate("createdBy", "name email role");
};

// Update Stock Quantity
const updateStock = async (id, { quantity, change, operation }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  if (quantity !== undefined) {
    const newQty = Number(quantity);
    if (isNaN(newQty) || newQty < 0) {
      throw new Error("Quantity must be a positive number or zero");
    }
    product.quantity = newQty;
  } else if (change !== undefined) {
    const delta = Number(change);
    if (isNaN(delta)) {
      throw new Error("Stock change value must be a valid number");
    }

    if (operation === "subtract" || delta < 0) {
      const reduction = Math.abs(delta);
      if (product.quantity < reduction) {
        throw new Error(
          `Insufficient stock. Current stock is ${product.quantity}, cannot reduce by ${reduction}`
        );
      }
      product.quantity -= reduction;
    } else {
      product.quantity += Math.abs(delta);
    }
  } else {
    throw new Error("Please provide either 'quantity' or 'change'");
  }

  await product.save();

  return {
    id: product._id,
    name: product.name,
    sku: product.sku,
    quantity: product.quantity,
    lowStockThreshold: product.lowStockThreshold,
    isLowStock: product.quantity <= product.lowStockThreshold,
  };
};

// Toggle Product Status
const toggleProductStatus = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  product.isActive = !product.isActive;
  await product.save();

  return product;
};

// Delete Product
const deleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID format");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  await Product.findByIdAndDelete(id);

  return {
    id: product._id,
    name: product.name,
    sku: product.sku,
  };
};

module.exports = {
  createProduct,
  getAllProducts,
  getLowStockProducts,
  getProductByIdOrSku,
  updateProduct,
  updateStock,
  toggleProductStatus,
  deleteProduct,
};
