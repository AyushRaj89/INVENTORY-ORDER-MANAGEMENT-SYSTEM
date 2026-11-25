const mongoose = require("mongoose");
const Category = require("./category.model");

// Create Category
const createCategory = async ({ name, description, isActive }, userId) => {
  const normalizedName = name.trim();

  // Check if category name already exists (case-insensitive)
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
  });

  if (existingCategory) {
    throw new Error("Category already exists with this name");
  }

  const category = await Category.create({
    name: normalizedName,
    description: description ? description.trim() : "",
    isActive: isActive !== undefined ? isActive : true,
    createdBy: userId || null,
  });

  return category;
};

// Get All Categories (with pagination, search, filter, and sorting)
const getAllCategories = async ({
  page = 1,
  limit = 10,
  search = "",
  isActive,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const query = {};

  // Search by name or description
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  // Filter by active status
  if (isActive !== undefined && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const validSortFields = ["name", "createdAt", "updatedAt", "isActive"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

  const [categories, total] = await Promise.all([
    Category.find(query)
      .populate("createdBy", "name email role")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Category.countDocuments(query),
  ]);

  return {
    categories,
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

// Get Category by ID
const getCategoryById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id).populate(
    "createdBy",
    "name email role"
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

// Update Category
const updateCategory = async (id, { name, description, isActive }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  // If name is changing, ensure uniqueness
  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });

    if (existing) {
      throw new Error("Category with this name already exists");
    }

    category.name = name.trim();
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  if (isActive !== undefined) {
    category.isActive = Boolean(isActive);
  }

  await category.save();

  return category;
};

// Delete Category
const deleteCategory = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  // Delete category
  await Category.findByIdAndDelete(id);

  return { id, name: category.name };
};

// Toggle Category Active Status
const toggleCategoryStatus = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  category.isActive = !category.isActive;
  await category.save();

  return category;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};

