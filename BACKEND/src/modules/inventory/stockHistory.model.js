const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["IN", "OUT", "ADJUSTMENT", "RETURN", "DAMAGED"],
        message: "{VALUE} is not a valid movement type (IN, OUT, ADJUSTMENT, RETURN, DAMAGED)",
      },
      required: [true, "Stock movement type is required"],
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity change is required"],
      min: [1, "Quantity must be at least 1"],
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "Stock adjustment",
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
stockHistorySchema.index({ product: 1, createdAt: -1 });
stockHistorySchema.index({ type: 1 });
stockHistorySchema.index({ createdAt: -1 });

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);

module.exports = StockHistory;

