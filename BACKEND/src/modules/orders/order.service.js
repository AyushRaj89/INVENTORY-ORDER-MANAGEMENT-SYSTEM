const mongoose = require("mongoose");
const Order = require("./order.model");
const Product = require("../products/product.model");
const StockHistory = require("../inventory/stockHistory.model");

// Helper: Generate unique Order Number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

// Helper: Resolve product by ObjectId, SKU, or Name
const resolveProduct = async (identifier) => {
  if (!identifier) return null;

  let idStr = identifier;
  if (typeof identifier === "object" && identifier !== null) {
    idStr = identifier._id || identifier.id || identifier.sku || identifier.name;
  }

  if (typeof idStr === "string") {
    idStr = idStr.trim();
  }

  if (!idStr) return null;

  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const byId = await Product.findById(idStr);
    if (byId) return byId;
  }

  const bySku = await Product.findOne({ sku: idStr.toUpperCase() });
  if (bySku) return bySku;

  const byName = await Product.findOne({
    name: { $regex: new RegExp(`^${idStr}$`, "i") },
  });
  if (byName) return byName;

  return null;
};

// Create Order (Deducts stock and logs inventory movement)
const createOrder = async (orderData, userId) => {
  const {
    customer,
    items,
    taxAmount = 0,
    discountAmount = 0,
    paymentStatus = "PENDING",
    paymentMethod = "CASH",
    orderStatus = "PENDING",
    notes = "",
  } = orderData;

  if (!customer || !customer.name || !customer.name.trim()) {
    throw new Error("Customer name is required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // 1. Validate all products and stock availability first
  const validatedItems = [];
  const productsToUpdate = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const requestedQty = Number(item.quantity);

    if (isNaN(requestedQty) || requestedQty <= 0) {
      throw new Error(`Item ${i + 1}: Quantity must be greater than 0`);
    }

    const productDoc = await resolveProduct(item.product);
    if (!productDoc) {
      throw new Error(
        `Item ${i + 1}: Product '${item.product}' not found. Please provide a valid product ID, SKU, or name.`
      );
    }

    if (!productDoc.isActive) {
      throw new Error(
        `Item ${i + 1}: Product '${productDoc.name}' is currently inactive.`
      );
    }

    if (productDoc.quantity < requestedQty) {
      throw new Error(
        `Insufficient stock for '${productDoc.name}'. In stock: ${productDoc.quantity}, requested: ${requestedQty}`
      );
    }

    const unitPrice =
      item.price !== undefined && !isNaN(Number(item.price))
        ? Number(item.price)
        : productDoc.price;

    const subtotal = Math.round(unitPrice * requestedQty * 100) / 100;

    validatedItems.push({
      product: productDoc._id,
      name: productDoc.name,
      sku: productDoc.sku,
      price: unitPrice,
      quantity: requestedQty,
      subtotal,
    });

    productsToUpdate.push({
      productDoc,
      deductQty: requestedQty,
    });
  }

  // 2. Calculate Financials
  const totalAmount =
    Math.round(
      validatedItems.reduce((acc, curr) => acc + curr.subtotal, 0) * 100
    ) / 100;

  const validTax = Math.max(0, Number(taxAmount) || 0);
  const validDiscount = Math.max(0, Number(discountAmount) || 0);
  const finalAmount =
    Math.round(Math.max(0, totalAmount + validTax - validDiscount) * 100) / 100;

  let orderNumber = generateOrderNumber();
  let exists = await Order.findOne({ orderNumber });
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await Order.findOne({ orderNumber });
  }

  // 3. Create the Order
  const order = await Order.create({
    orderNumber,
    customer: {
      name: customer.name.trim(),
      email: customer.email ? customer.email.trim().toLowerCase() : "",
      phone: customer.phone ? customer.phone.trim() : "",
      address: customer.address ? customer.address.trim() : "",
    },
    items: validatedItems,
    totalAmount,
    taxAmount: validTax,
    discountAmount: validDiscount,
    finalAmount,
    paymentStatus: paymentStatus.toUpperCase(),
    paymentMethod: paymentMethod.toUpperCase(),
    orderStatus: orderStatus.toUpperCase(),
    notes: notes ? notes.trim() : "",
    createdBy: userId || null,
  });

  // 4. Deduct Stock & Record Inventory Stock Movements
  for (const item of productsToUpdate) {
    const { productDoc, deductQty } = item;
    const previousStock = productDoc.quantity;
    const newStock = previousStock - deductQty;

    productDoc.quantity = newStock;
    await productDoc.save();

    await StockHistory.create({
      product: productDoc._id,
      type: "OUT",
      quantity: deductQty,
      previousStock,
      newStock,
      reason: `Order fulfillment - ${orderNumber}`,
      reference: orderNumber,
      performedBy: userId || null,
    });
  }

  return await Order.findById(order._id)
    .populate("items.product", "name sku category unit price imageUrl")
    .populate("createdBy", "name email role");
};

// Get All Orders (with filters, pagination, and sorting)
const getAllOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  orderStatus,
  paymentStatus,
  paymentMethod,
  startDate,
  endDate,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  const query = {};

  // Search keyword in orderNumber, customer name, email, or phone
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [
      { orderNumber: searchRegex },
      { "customer.name": searchRegex },
      { "customer.email": searchRegex },
      { "customer.phone": searchRegex },
    ];
  }

  if (orderStatus && orderStatus.trim()) {
    query.orderStatus = orderStatus.toUpperCase().trim();
  }

  if (paymentStatus && paymentStatus.trim()) {
    query.paymentStatus = paymentStatus.toUpperCase().trim();
  }

  if (paymentMethod && paymentMethod.trim()) {
    query.paymentMethod = paymentMethod.toUpperCase().trim();
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const validSortFields = [
    "orderNumber",
    "finalAmount",
    "orderStatus",
    "paymentStatus",
    "createdAt",
    "updatedAt",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("createdBy", "name email role")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return {
    orders,
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

// Get Order by ID or Order Number
const getOrderByIdOrNumber = async (identifier) => {
  if (!identifier) {
    throw new Error("Order ID or order number is required");
  }

  let query;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = {
      $or: [{ _id: identifier }, { orderNumber: identifier.toUpperCase() }],
    };
  } else {
    query = { orderNumber: identifier.toUpperCase().trim() };
  }

  const order = await Order.findOne(query)
    .populate("items.product", "name sku category unit price imageUrl")
    .populate("createdBy", "name email role");

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

// Update Order Status (Restores stock if CANCELLED)
const updateOrderStatus = async (identifier, newStatus, userId) => {
  const order = await getOrderByIdOrNumber(identifier);

  const upperStatus = (newStatus || "").toUpperCase().trim();
  const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"];
  if (!validStatuses.includes(upperStatus)) {
    throw new Error(
      `Invalid order status '${newStatus}'. Valid statuses are: ${validStatuses.join(", ")}`
    );
  }

  if (order.orderStatus === upperStatus) {
    return order;
  }

  if (order.orderStatus === "CANCELLED") {
    throw new Error("Cannot change status of an already cancelled order");
  }

  // If cancelling order, restore stock back to inventory!
  if (upperStatus === "CANCELLED") {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.quantity;
        const newStock = previousStock + item.quantity;

        product.quantity = newStock;
        await product.save();

        await StockHistory.create({
          product: product._id,
          type: "RETURN",
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Order cancelled - ${order.orderNumber}`,
          reference: order.orderNumber,
          performedBy: userId || null,
        });
      }
    }
  }

  order.orderStatus = upperStatus;
  await order.save();

  return await getOrderByIdOrNumber(order._id);
};

// Update Payment Status
const updatePaymentStatus = async (identifier, newPaymentStatus) => {
  const order = await getOrderByIdOrNumber(identifier);

  const upperPayment = (newPaymentStatus || "").toUpperCase().trim();
  const validPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];
  if (!validPaymentStatuses.includes(upperPayment)) {
    throw new Error(
      `Invalid payment status '${newPaymentStatus}'. Valid statuses are: ${validPaymentStatuses.join(", ")}`
    );
  }

  order.paymentStatus = upperPayment;
  await order.save();

  return await getOrderByIdOrNumber(order._id);
};

// Get Order Stats & Revenue Analytics
const getOrderStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [overallStats, statusCounts, paymentMethodCounts, todayStats] =
    await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
              },
            },
            pendingRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "PENDING"] },
                  "$finalAmount",
                  0,
                ],
              },
            },
            averageOrderValue: { $avg: "$finalAmount" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            amount: { $sum: "$finalAmount" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            todayOrders: { $sum: 1 },
            todayRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$finalAmount", 0],
              },
            },
          },
        },
      ]),
    ]);

  const general = overallStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    averageOrderValue: 0,
  };

  const todayData = todayStats[0] || {
    todayOrders: 0,
    todayRevenue: 0,
  };

  const statusMap = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  statusCounts.forEach((s) => {
    if (s._id) statusMap[s._id] = s.count;
  });

  return {
    totalOrders: general.totalOrders,
    totalRevenue: Math.round(general.totalRevenue * 100) / 100,
    pendingRevenue: Math.round(general.pendingRevenue * 100) / 100,
    averageOrderValue: Math.round((general.averageOrderValue || 0) * 100) / 100,
    todayOrders: todayData.todayOrders,
    todayRevenue: Math.round(todayData.todayRevenue * 100) / 100,
    statusBreakdown: statusMap,
    paymentMethodBreakdown: paymentMethodCounts.map((p) => ({
      method: p._id,
      count: p.count,
      amount: Math.round(p.amount * 100) / 100,
    })),
  };
};

// Delete Order (Admin only)
const deleteOrder = async (identifier, userId) => {
  const order = await getOrderByIdOrNumber(identifier);

  // If order wasn't cancelled, restore stock before deleting!
  if (order.orderStatus !== "CANCELLED") {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.quantity;
        const newStock = previousStock + item.quantity;
        product.quantity = newStock;
        await product.save();

        await StockHistory.create({
          product: product._id,
          type: "RETURN",
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Order deleted - ${order.orderNumber}`,
          reference: order.orderNumber,
          performedBy: userId || null,
        });
      }
    }
  }

  await Order.findByIdAndDelete(order._id);

  return {
    id: order._id,
    orderNumber: order.orderNumber,
  };
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderByIdOrNumber,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  deleteOrder,
};

