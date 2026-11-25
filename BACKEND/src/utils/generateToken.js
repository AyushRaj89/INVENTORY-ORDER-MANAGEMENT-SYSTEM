const jwt = require("jsonwebtoken");

const generateToken = (userId, role = null) => {
  const payload =
    typeof userId === "object" && userId !== null && !userId._bsontype
      ? { id: userId.id || userId._id, role: userId.role }
      : { id: userId.toString ? userId.toString() : userId, ...(role ? { role } : {}) };

  return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret_key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
