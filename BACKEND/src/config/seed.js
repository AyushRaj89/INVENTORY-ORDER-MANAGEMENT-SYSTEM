require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../modules/users/users.model");
const Category = require("../modules/categories/category.model");
const Product = require("../modules/products/product.model");
const Order = require("../modules/orders/order.model");
const StockHistory = require("../modules/inventory/stockHistory.model");

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // Clean existing data
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      StockHistory.deleteMany({}),
    ]);
    console.log("Database cleared.");

    // 1. Seed Users
    console.log("Seeding users...");
    const adminPassword = await bcrypt.hash("Admin123!", 12);
    const staffPassword = await bcrypt.hash("Staff123!", 12);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@ims.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    });

    const staff = await User.create({
      name: "Staff Member",
      email: "staff@ims.com",
      password: staffPassword,
      role: "STAFF",
      isActive: true,
    });

    console.log("Users created: admin@ims.com, staff@ims.com (Passwords: Admin123! / Staff123!)");

    // 2. Seed Categories
    console.log("Seeding categories...");
    const [electronics, furniture, groceries, apparel] = await Promise.all([
      Category.create({
        name: "Electronics",
        description: "Computers, peripherals, gadgets, and consumer electronics",
        isActive: true,
        createdBy: admin._id,
      }),
      Category.create({
        name: "Furniture",
        description: "Office and warehouse desks, chairs, and storage units",
        isActive: true,
        createdBy: admin._id,
      }),
      Category.create({
        name: "Groceries",
        description: "Pantry supplies, beverages, and consumable goods",
        isActive: true,
        createdBy: admin._id,
      }),
      Category.create({
        name: "Apparel",
        description: "Staff uniforms, merchandise, and protective clothing",
        isActive: true,
        createdBy: admin._id,
      }),
    ]);

    console.log("Categories created: Electronics, Furniture, Groceries, Apparel");

    // 3. Seed Products
    console.log("Seeding products...");
    const productsData = [
      {
        name: "Logitech MX Master 3S Mouse",
        sku: "ELEC-LOG-001",
        description: "Ergonomic wireless mouse with 8K DPI sensor and quiet clicks",
        category: electronics._id,
        price: 99.99,
        costPrice: 60.00,
        quantity: 45,
        lowStockThreshold: 10,
        unit: "pcs",
        createdBy: admin._id,
      },
      {
        name: "Dell UltraSharp 27 4K Monitor",
        sku: "ELEC-DEL-002",
        description: "27-inch 4K UHD USB-C Hub Monitor with IPS Black technology",
        category: electronics._id,
        price: 499.99,
        costPrice: 350.00,
        quantity: 12,
        lowStockThreshold: 5,
        unit: "pcs",
        createdBy: admin._id,
      },
      {
        name: "Mechanical Gaming Keyboard",
        sku: "ELEC-KEY-003",
        description: "Hot-swappable RGB mechanical keyboard with linear switches",
        category: electronics._id,
        price: 129.99,
        costPrice: 75.00,
        quantity: 4, // Trigger Low Stock Alert!
        lowStockThreshold: 8,
        unit: "pcs",
        createdBy: admin._id,
      },
      {
        name: "Ergonomic Office Chair",
        sku: "FURN-CHR-001",
        description: "High-back mesh chair with lumbar support and 3D armrests",
        category: furniture._id,
        price: 249.99,
        costPrice: 140.00,
        quantity: 18,
        lowStockThreshold: 5,
        unit: "pcs",
        createdBy: admin._id,
      },
      {
        name: "Electric Standing Desk 60x30",
        sku: "FURN-DSK-002",
        description: "Dual-motor motorized standing desk with memory presets",
        category: furniture._id,
        price: 399.99,
        costPrice: 220.00,
        quantity: 0, // Trigger Out of Stock Alert!
        lowStockThreshold: 3,
        unit: "pcs",
        createdBy: admin._id,
      },
      {
        name: "Organic Arabica Coffee Beans (1kg)",
        sku: "GROC-COF-001",
        description: "Medium roast fair-trade organic coffee beans",
        category: groceries._id,
        price: 24.50,
        costPrice: 12.00,
        quantity: 80,
        lowStockThreshold: 15,
        unit: "bags",
        createdBy: admin._id,
      },
      {
        name: "Cotton Crewneck T-Shirt",
        sku: "APPR-TSH-001",
        description: "Heavyweight 100% combed cotton blank t-shirt",
        category: apparel._id,
        price: 19.99,
        costPrice: 7.50,
        quantity: 120,
        lowStockThreshold: 20,
        unit: "pcs",
        createdBy: admin._id,
      },
    ];

    const products = await Product.insertMany(productsData);
    console.log(`Products created: ${products.length} products`);

    // 4. Seed Stock History Logs
    console.log("Seeding stock history...");
    const stockHistoryEntries = [
      {
        product: products[0]._id,
        type: "IN",
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        reason: "Initial supplier shipment",
        reference: "PO-2026-001",
        performedBy: admin._id,
      },
      {
        product: products[1]._id,
        type: "IN",
        quantity: 15,
        previousStock: 0,
        newStock: 15,
        reason: "Initial supplier shipment",
        reference: "PO-2026-001",
        performedBy: admin._id,
      },
      {
        product: products[5]._id,
        type: "DAMAGED",
        quantity: 2,
        previousStock: 82,
        newStock: 80,
        reason: "Water damage during warehouse transport",
        reference: "WASTE-001",
        performedBy: staff._id,
      },
    ];
    await StockHistory.insertMany(stockHistoryEntries);
    console.log("Stock movements logged.");

    // 5. Seed Orders
    console.log("Seeding sample customer orders...");
    const order1 = await Order.create({
      orderNumber: "ORD-20261118-A101",
      customer: {
        name: "Alex Turner",
        email: "alex.turner@gmail.com",
        phone: "+1 555-0192",
        address: "742 Evergreen Terrace, Springfield",
      },
      items: [
        {
          product: products[0]._id,
          name: products[0].name,
          sku: products[0].sku,
          price: products[0].price,
          quantity: 2,
          subtotal: 199.98,
        },
        {
          product: products[2]._id,
          name: products[2].name,
          sku: products[2].sku,
          price: products[2].price,
          quantity: 1,
          subtotal: 129.99,
        },
      ],
      totalAmount: 329.97,
      taxAmount: 16.50,
      discountAmount: 10.00,
      finalAmount: 336.47,
      paymentStatus: "PAID",
      paymentMethod: "CARD",
      orderStatus: "COMPLETED",
      notes: "Customer requested contactless delivery",
      createdBy: staff._id,
    });

    const order2 = await Order.create({
      orderNumber: "ORD-20261118-B202",
      customer: {
        name: "Sarah Connor",
        email: "sarah.connor@sky.net",
        phone: "+1 555-0841",
        address: "100 Cyberdyne Way, Los Angeles",
      },
      items: [
        {
          product: products[1]._id,
          name: products[1].name,
          sku: products[1].sku,
          price: products[1].price,
          quantity: 1,
          subtotal: 499.99,
        },
        {
          product: products[3]._id,
          name: products[3].name,
          sku: products[3].sku,
          price: products[3].price,
          quantity: 1,
          subtotal: 249.99,
        },
      ],
      totalAmount: 749.98,
      taxAmount: 37.50,
      discountAmount: 0.00,
      finalAmount: 787.48,
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      orderStatus: "PROCESSING",
      notes: "Priority dispatch",
      createdBy: admin._id,
    });

    const order3 = await Order.create({
      orderNumber: "ORD-20261119-C303",
      customer: {
        name: "David Miller",
        email: "david.m@corp.org",
        phone: "+1 555-0374",
        address: "45 Industrial Parkway, Chicago",
      },
      items: [
        {
          product: products[5]._id,
          name: products[5].name,
          sku: products[5].sku,
          price: products[5].price,
          quantity: 4,
          subtotal: 98.00,
        },
        {
          product: products[6]._id,
          name: products[6].name,
          sku: products[6].sku,
          price: products[6].price,
          quantity: 6,
          subtotal: 119.94,
        },
      ],
      totalAmount: 217.94,
      taxAmount: 10.90,
      discountAmount: 15.00,
      finalAmount: 213.84,
      paymentStatus: "PENDING",
      paymentMethod: "CASH",
      orderStatus: "PENDING",
      notes: "Cash on delivery",
      createdBy: staff._id,
    });

    console.log(`Orders created: ${order1.orderNumber}, ${order2.orderNumber}, ${order3.orderNumber}`);

    console.log("\n==============================================");
    console.log("🎉 DATABASE SEEDED SUCCESSFULLY!");
    console.log("==============================================");
    console.log("Credentials:");
    console.log("  Admin: admin@ims.com / Admin123!");
    console.log("  Staff: staff@ims.com / Staff123!");
    console.log("==============================================");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();

