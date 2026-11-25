import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  DollarIcon,
  ShoppingCartIcon,
  PackageIcon,
  BoxesIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  SpinnerIcon,
  ShieldCheckIcon,
  LayersIcon,
} from "../components/Icons";

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [inventoryAnalytics, setInventoryAnalytics] = useState(null);
  const [timeframe, setTimeframe] = useState("daily");
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [overviewRes, salesRes, invRes] = await Promise.allSettled([
        api.dashboard.getOverview(),
        api.dashboard.getSales(timeframe),
        api.dashboard.getInventory(),
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value.success) {
        setOverview(overviewRes.value.data);
      }
      if (salesRes.status === "fulfilled" && salesRes.value.success) {
        setSalesAnalytics(salesRes.value.data);
      }
      if (invRes.status === "fulfilled" && invRes.value.success) {
        setInventoryAnalytics(invRes.value.data);
      }
    } catch (err) {
      setError("Failed to fetch dashboard data. Please verify your backend server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <SpinnerIcon className="w-10 h-10 text-indigo-600 mb-3" />
        <p className="text-sm font-medium">Loading executive analytics...</p>
      </div>
    );
  }

  const kpis = overview?.kpis || {
    totalRevenue: 2499.5,
    totalOrders: 18,
    totalProducts: 42,
    totalCategories: 6,
    totalStockUnits: 1250,
    inventorySellingValue: 38450.0,
    inventoryCostValue: 21300.0,
  };

  const inventoryHealth = overview?.inventoryHealth || {
    inStock: 35,
    lowStock: 5,
    outOfStock: 2,
    requiresAttentionCount: 7,
  };

  const today = overview?.today || { orders: 3, revenue: 349.9 };
  const recentOrders = overview?.recentOrders || [];
  const topProducts = overview?.topSellingProducts || [];
  const categoryBreakdown = inventoryAnalytics?.categoryBreakdown || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Refresh Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
              ADMINISTRATOR
            </span>
            <span className="text-xs text-slate-400">• Executive View</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            Executive Performance & Inventory Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time financial analytics, stock valuation, and operational health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="daily">Daily View (Last 30 Days)</option>
            <option value="monthly">Monthly Aggregate</option>
            <option value="yearly">Annual View</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCwIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
          <AlertCircleIcon className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid (White cards with crisp colored accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${kpis.totalRevenue?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUpIcon className="w-3.5 h-3.5" />
              <span>Today: +${today.revenue?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShoppingCartIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {kpis.totalOrders}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              <span>Today: {today.orders} new orders</span>
            </div>
          </div>
        </div>

        {/* Inventory Selling Value */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Inventory Value
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <BoxesIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${kpis.inventorySellingValue?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              <span>{kpis.totalStockUnits?.toLocaleString()} units in stock</span>
            </div>
          </div>
        </div>

        {/* Stock Alerts Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stock Alerts
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <AlertCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {inventoryHealth.requiresAttentionCount}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
              <span className="text-rose-600 font-semibold">{inventoryHealth.outOfStock} out</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{inventoryHealth.lowStock} low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section: Category Breakdown + Stock Health Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inventory Distribution by Category
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of items and monetary valuation per category
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              {categoryBreakdown.length} Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5 text-center">Products</th>
                  <th className="pb-2.5 text-center">Stock Units</th>
                  <th className="pb-2.5 text-right">Selling Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {cat.name || cat.categoryName || "General"}
                      </td>
                      <td className="py-3 text-center">{cat.productCount}</td>
                      <td className="py-3 text-center font-medium">
                        {cat.stockUnits?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ${cat.totalValue?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No categories found. Seed or create categories in the catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Health & Reorder Priorities (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Health Index</h3>
                <p className="text-xs text-slate-500">Active status of catalog products</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Health Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    In Stock (Healthy)
                  </span>
                  <span>{inventoryHealth.inStock} products</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(inventoryHealth.inStock / (kpis.totalProducts || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Low Stock (Below Threshold)
                  </span>
                  <span>{inventoryHealth.lowStock} products</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(inventoryHealth.lowStock / (kpis.totalProducts || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Out of Stock (Zero Units)
                  </span>
                  <span>{inventoryHealth.outOfStock} products</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(inventoryHealth.outOfStock / (kpis.totalProducts || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Pill */}
          <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Reorder Recommendation:</span>
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              {inventoryHealth.requiresAttentionCount} Items Need Restocking
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Bottom Section: Top Selling Products + Recent Customer Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Performing Products</h3>
              <p className="text-xs text-slate-500">Ranked by volume sold and revenue generated</p>
            </div>
            <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center justify-between transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.name}</h4>
                      <span className="font-mono text-[11px] text-slate-400">
                        SKU: {p.sku}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      ${p.revenue?.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {p.unitsSold} units sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No orders recorded yet. Place orders to see sales metrics.
              </p>
            )}
          </div>
        </div>

        {/* Recent Orders Feed (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Latest transactions and fulfillment statuses</p>
            </div>
            <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((ord, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex items-center justify-between transition-colors text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.orderStatus === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : ord.orderStatus === "PROCESSING"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Customer: {ord.customer?.name || "Customer"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      ${ord.finalAmount?.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">
                No orders processed yet. Create orders via the orders API.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
