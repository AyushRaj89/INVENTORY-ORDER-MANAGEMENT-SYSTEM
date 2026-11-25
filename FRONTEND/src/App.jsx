import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { StaffDashboard } from "./pages/StaffDashboard";
import { AuthHub } from "./pages/AuthHub";
import {
  BoxesIcon,
  ShieldCheckIcon,
  LockIcon,
  UserIcon,
  LogOutIcon,
  SpinnerIcon,
  LayersIcon,
} from "./components/Icons";

const MainApp = () => {
  const { isAuthenticated, user, isAdmin, logout, loading } = useAuth();
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [activePortalTab, setActivePortalTab] = useState("dashboard"); // "dashboard" | "profile"
  const [adminSimulatedRole, setAdminSimulatedRole] = useState(null); // null | "STAFF" | "ADMIN"

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700">
        <SpinnerIcon className="w-10 h-10 text-indigo-600 mb-4" />
        <p className="text-sm font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  // Determine current active dashboard view based on user role or admin simulation
  const effectiveRole = adminSimulatedRole || user?.role || "STAFF";

  // If not authenticated, render the login/registration screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        {/* Top Navbar */}
        <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20">
                <BoxesIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  StockPulse <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">IMS</span>
                </h1>
                <p className="text-[11px] text-slate-400 leading-none">
                  Inventory Management System
                </p>
              </div>
            </div>

            {/* Switch Sign In / Register */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setAuthTab("login")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  authTab === "login"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthTab("register")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  authTab === "register"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>
          </div>
        </header>

        {/* Main Auth Form Container */}
        <main className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
          <div className="w-full relative z-10">
            {authTab === "login" ? (
              <LoginPage onSwitchToRegister={() => setAuthTab("register")} />
            ) : (
              <RegisterPage onSwitchToLogin={() => setAuthTab("login")} />
            )}
          </div>
        </main>

        <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
          <p>© 2026 Inventory Management System. Protected with JWT & Role-Based Access Control.</p>
        </footer>
      </div>
    );
  }

  // AUTHENTICATED PORTAL: Clean, primarily white background layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <BoxesIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                StockPulse <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">IMS</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium leading-none">
                {effectiveRole === "ADMIN" ? "Admin Executive Portal" : "Warehouse Operations Portal"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActivePortalTab("dashboard")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activePortalTab === "dashboard"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePortalTab("profile")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activePortalTab === "profile"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Profile & Security
            </button>
          </div>

          {/* Right Controls: Role Switcher (Admin test feature) & User Profile */}
          <div className="flex items-center gap-3">
            {/* If Admin, allow testing Staff Dashboard directly */}
            {isAdmin && (
              <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
                <span className="text-slate-500 px-1.5">View as:</span>
                <button
                  onClick={() => setAdminSimulatedRole("ADMIN")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    effectiveRole === "ADMIN"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Admin View
                </button>
                <button
                  onClick={() => setAdminSimulatedRole("STAFF")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    effectiveRole === "STAFF"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Staff View
                </button>
              </div>
            )}

            {/* User Profile Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-slate-900 hidden sm:inline">
                {user?.name}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  user?.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {user?.role}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Crisp mostly-white dashboard environment) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activePortalTab === "profile" ? (
          <AuthHub />
        ) : effectiveRole === "ADMIN" ? (
          <AdminDashboard />
        ) : (
          <StaffDashboard />
        )}
      </main>

      {/* Light Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 StockPulse IMS. Enterprise Inventory Management & Real-Time Tracking.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">API Status: Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
