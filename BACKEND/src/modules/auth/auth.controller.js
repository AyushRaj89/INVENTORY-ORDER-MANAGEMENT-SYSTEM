const authService = require("./auth.service");

// Register (Staff or Admin)
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    if (role && !["ADMIN", "STAFF"].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'ADMIN' or 'STAFF'",
      });
    }

    const result = await authService.registerUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Email already registered") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.loginUser(
      email.toLowerCase().trim(),
      password
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const statusCode = error.message === "Account is deactivated" ? 403 : 401;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Current User Profile (Protected)
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: { user },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

// Update Profile (Protected)
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least name or email to update",
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const updatedUser = await authService.updateProfile(req.user._id, {
      name,
      email,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    const statusCode =
      error.message === "Email is already in use by another account" ? 409 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Change Password (Protected)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: result,
    });
  } catch (error) {
    const statusCode = error.message === "Incorrect current password" ? 401 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Token discarded on client.",
  });
};

// Role-protected test route for testing ADMIN authorization
const adminOnlyCheck = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authorized: You have ADMIN privileges to access this resource.",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  adminOnlyCheck,
};
