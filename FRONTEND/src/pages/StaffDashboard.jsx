import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  PackageIcon,
  ShoppingCartIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  SpinnerIcon,
  BoxesIcon,
  TrendingUpIcon,
} from "../components/Icons";

export const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Quick Stock Adjustment Form State
  const [adjustProduct, setAdjustProduct] = useState("");
  const [adjustType, setAdjustType] = useState("IN");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustFeedback, setAdjustFeedback] = useState(null);

  const fetchStaffData = async () => {
    try {
      const [levelsRes, ordersRes, alertsRes] = await Promise.allSettled([
        api.inventory.getLevels({ limit: 50 }),
        api.orders.getOrders({ limit: 20 }),
        api.inventory.getAlerts(),
      ]);

      if (levelsRes.status === "fulfilled" && levelsRes.value.success) {
        setInventoryItems(levelsRes.value.data.inventory || []);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value.success) {
        setOrders(ordersRes.value.data.orders || []);
      }
      if (alertsRes.status === "fulfilled" && alertsRes.value.success) {
        setAlerts(alertsRes.value.data.alerts || []);
      }
    } catch {
      // Keep UI resilient
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStaffData();
  };

  const handleQuickAdjust = async (e) => {
    e.preventDefault();
    setAdjustFeedback(null);

    if (!adjustProduct || !adjustQty || Number(adjustQty) <= 0) {
      setAdjustFeedback({
        type: "error",
        message: "Please enter a valid product identifier and quantity > 0",
      });
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await api.inventory.adjustStock({
        product: adjustProduct,
        type: adjustType,
        quantity: Number(adjustQty),
        reason: adjustReason || `Staff floor adjustment (${adjustType})`,
      });

      if (res.success) {
        setAdjustFeedback({
          type: "success",
          message: `Stock updated for ${res.data.product?.name}: ${res.data.product?.currentStock} ${res.data.product?.unit} available now.`,
        });
        setAdjustQty("");
        setAdjustReason("");
        // Refresh table in background
        fetchStaffData();
      } else {
        setAdjustFeedback({ type: "error", message: res.message });
      }
    } catch (err) {
      setAdjustFeedback({
        type: "error",
        message: err.message || "Failed to adjust stock",
      });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleAdvanceOrderStatus = async (orderId, currentStatus) => {
    let nextStatus = "PROCESSING";
    if (currentStatus === "PROCESSING") nextStatus = "COMPLETED";

    try {
      const res = await api.orders.updateStatus(orderId, nextStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((ord) =>
            ord._id === orderId ? { ...ord, orderStatus: nextStatus } : ord
          )
        );
      }
    } catch {
      // Ignored
    }
  };

  // Filtered inventory list
  const filteredInventory = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && item.stockStatus === statusFilter;
  });

  const pendingOrders = orders.filter((o) => o.orderStatus === "PENDING");
  const processingOrders = orders.filter((o) => o.orderStatus === "PROCESSING");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <SpinnerIcon className="w-10 h-10 text-emerald-600 mb-3" />
        <p className="text-sm font-medium">Loading staff operations board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              STAFF MEMBER
            </span>
            <span className="text-xs text-slate-400">• Warehouse Floor & Fulfillment</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            Inventory Operations & Order Fulfillment
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quick restock, real-time stock levels, and dispatch queue
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-center px-3.5 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCwIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Floor Data</span>
        </button>
      </div>

      {/* Operational KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Active Items
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {inventoryItems.length}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Catalog products</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <PackageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Pending Orders
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {pendingOrders.length + processingOrders.length}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Need fulfillment</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <ShoppingCartIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Stock Warnings
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {alerts.length}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Critical or Low</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertCircleIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Healthy Stock
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {inventoryItems.filter((i) => i.stockStatus === "IN_STOCK").length}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">Sufficient inventory</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: Quick Adjust Tool + Live Inventory Levels Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Stock Adjustment Tool (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BoxesIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Quick Stock Adjustment
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Restock incoming shipments or deduct dispatched goods in real-time.
            </p>

            {adjustFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
                  adjustFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {adjustFeedback.type === "success" ? (
                  <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{adjustFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleQuickAdjust} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name or SKU
                </label>
                <input
                  type="text"
                  value={adjustProduct}
                  onChange={(e) => setAdjustProduct(e.target.value)}
                  placeholder="e.g. ELEC-KEY-003 or Wireless Mouse"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("IN")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adjustType === "IN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    + Restock (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("OUT")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      adjustType === "OUT"
                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    - Dispatch (OUT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DAMAGED")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer col-span-2 ${
                      adjustType === "DAMAGED"
                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    ⚠ Damaged / Write-Off
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Supplier delivery PO-99"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={adjustSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {adjustSubmitting ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 text-white" />
                    <span>Adjusting...</span>
                  </>
                ) : (
                  <span>Submit Stock Adjustment</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Inventory Levels Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Floor Stock Levels
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time inventory counts and status indicators
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    statusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({inventoryItems.length})
                </button>
                <button
                  onClick={() => setStatusFilter("LOW_STOCK")}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    statusFilter === "LOW_STOCK"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-amber-600 hover:text-amber-700"
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStatusFilter("OUT_OF_STOCK")}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    statusFilter === "OUT_OF_STOCK"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-rose-600 hover:text-rose-700"
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title or SKU..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[360px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-center">Stock</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5">
                          <span className="font-bold text-slate-900 block">
                            {item.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600">{item.category}</td>
                        <td className="py-2.5 text-center font-bold text-slate-900">
                          {item.quantity}{" "}
                          <span className="text-[10px] font-normal text-slate-400">
                            {item.unit}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stockStatus === "IN_STOCK"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : item.stockStatus === "LOW_STOCK"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {item.stockStatus === "IN_STOCK"
                              ? "Healthy"
                              : item.stockStatus === "LOW_STOCK"
                              ? "Low Stock"
                              : "Out of Stock"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustProduct(item.sku);
                              setAdjustType("IN");
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            + Add Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No matching products found on floor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Fulfillment Queue */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Orders Ready for Packing & Dispatch
            </h3>
            <p className="text-xs text-slate-500">
              Advance order statuses as items are picked, packed, and fulfilled
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {orders.length} Total Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2.5">Order Number</th>
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Total Items</th>
                <th className="pb-2.5">Amount</th>
                <th className="pb-2.5 text-center">Current Status</th>
                <th className="pb-2.5 text-right">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length > 0 ? (
                orders.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-900 block">
                        {ord.customer?.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {ord.customer?.phone || ord.customer?.email}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {ord.items?.length} line item(s)
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      ${ord.finalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : ord.orderStatus === "PROCESSING"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : ord.orderStatus === "CANCELLED"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {ord.orderStatus === "PENDING" && (
                        <button
                          onClick={() => handleAdvanceOrderStatus(ord._id, "PENDING")}
                          className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          → Start Processing
                        </button>
                      )}
                      {ord.orderStatus === "PROCESSING" && (
                        <button
                          onClick={() => handleAdvanceOrderStatus(ord._id, "PROCESSING")}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        >
                          ✓ Mark Dispatched
                        </button>
                      )}
                      {ord.orderStatus === "COMPLETED" && (
                        <span className="text-[11px] font-medium text-emerald-600">
                          ✓ Fulfilled
                        </span>
                      )}
                      {ord.orderStatus === "CANCELLED" && (
                        <span className="text-[11px] font-medium text-slate-400">
                          Restocked
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No active orders in fulfillment queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
