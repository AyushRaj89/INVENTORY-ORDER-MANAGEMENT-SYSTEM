const categoryService = require("./category.service");

// Create Category
const createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Category name must be between 2 and 50 characters",
      });
    }

    const category = await categoryService.createCategory(
      {
        name: name.trim(),
        description,
        isActive,
      },
      req.user?._id
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    if (error.message === "Category already exists with this name") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

// Get All Categories
const getCategories = async (req, res) => {
  try {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

    const result = await categoryService.getAllCategories({
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

// Get Category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: { category },
    });
  } catch (error) {
    if (error.message === "Invalid category ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty",
        });
      }

      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: "Category name must be between 2 and 50 characters",
        });
      }
    }

    const category = await categoryService.updateCategory(id, {
      name,
      description,
      isActive,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    if (error.message === "Invalid category ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Category with this name already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

// Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await categoryService.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Invalid category ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};

// Toggle Category Active Status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryService.toggleCategoryStatus(id);

    return res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: { category },
    });
  } catch (error) {
    if (error.message === "Invalid category ID format") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Category not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle category status",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};

