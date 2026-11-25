const orderService = require("./order.service");

// Create Order
const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      taxAmount,
      discountAmount,
      paymentStatus,
      paymentMethod,
      orderStatus,
      notes,
    } = req.body;

    const order = await orderService.createOrder(
      {
        customer,
        items,
        taxAmount,
        discountAmount,
        paymentStatus,
        paymentMethod,
        orderStatus,
        notes,
      },
      req.user?._id
    );

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    if (
      error.message.includes("Insufficient stock") ||
      error.message.includes("Customer name is required") ||
      error.message.includes("Order must contain") ||
      error.message.includes("Quantity must be") ||
      error.message.includes("is currently inactive")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// Get All Orders
const getOrders = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await orderService.getAllOrders({
      page,
      limit,
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get Order Stats & Revenue Analytics
const getOrderStats = async (req, res) => {
  try {
    const stats = await orderService.getOrderStats();

    return res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order statistics",
    });
  }
};

// Get Order by ID or Order Number
const getOrderByIdOrNumber = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderService.getOrderByIdOrNumber(id);

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: { order },
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (PENDING, PROCESSING, COMPLETED, CANCELLED)",
      });
    }

    const order = await orderService.updateOrderStatus(
      id,
      status,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${order.orderStatus}'`,
      data: { order },
    });
  } catch (error) {
    if (
      error.message.includes("Invalid order status") ||
      error.message.includes("already cancelled")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// Cancel Order (Shorthand helper)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await orderService.updateOrderStatus(
      id,
      "CANCELLED",
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled and items returned to inventory successfully",
      data: { order },
    });
  } catch (error) {
    if (error.message.includes("already cancelled")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

// Update Payment Status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Payment status is required (PENDING, PAID, FAILED, REFUNDED)",
      });
    }

    const order = await orderService.updatePaymentStatus(id, paymentStatus);

    return res.status(200).json({
      success: true,
      message: `Payment status updated to '${order.paymentStatus}'`,
      data: { order },
    });
  } catch (error) {
    if (error.message.includes("Invalid payment status")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update payment status",
    });
  }
};

// Delete Order (Admin only)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await orderService.deleteOrder(id, req.user?._id);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully (stock restored if active)",
      data: result,
    });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderStats,
  getOrderByIdOrNumber,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  deleteOrder,
};

