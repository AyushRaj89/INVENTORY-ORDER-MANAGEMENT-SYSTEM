const User = require("../users/users.model");
const generateToken = require("../../utils/generateToken");

// Register User (defaults to STAFF, supports ADMIN if specified)
const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const assignedRole =
    role && ["ADMIN", "STAFF"].includes(role.toUpperCase())
      ? role.toUpperCase()
      : "STAFF";

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
  });

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  };
};

// Login User
const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  };
};

// Get User Profile by ID
const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// Update Profile (Name & Email)
const updateProfile = async (userId, { name, email }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: userId },
    });

    if (existing) {
      throw new Error("Email is already in use by another account");
    }

    user.email = email.toLowerCase().trim();
  }

  if (name) {
    user.name = name.trim();
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

// Change Password
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password cannot be the same as current password");
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user._id, user.role);

  return {
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
};
