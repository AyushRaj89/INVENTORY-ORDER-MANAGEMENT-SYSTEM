import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SpinnerIcon,
  BoxesIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  CheckCircleIcon,
} from "../components/Icons";

export const LoginPage = ({ onSwitchToRegister }) => {
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email || !password) {
      setLocalError("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setLocalError(result.error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Two-Part Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden transition-all">
        
        {/* LEFT HALF: About the website with real product images & inventory purpose */}
        <div className="lg:col-span-6 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Decorative Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-5">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
              <BoxesIcon className="w-4 h-4 text-indigo-400" />
              <span>StockPulse IMS • Inventory Platform</span>
            </div>

            {/* Bold Headline */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Real-Time Stock & Catalog Management.
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                Track warehouse items, automate reorder alerts, manage sales orders, and eliminate inventory discrepancies with complete end-to-end visibility.
              </p>
            </div>

            {/* Product Images Showcase Representing IMS Purpose */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Live Catalog Preview
                </span>
                <span className="text-[11px] text-indigo-300">Auto-Syncing</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Product 1: In Stock */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-lg hover:border-white/30 transition-all group">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800 mb-2">
                    <img
                      src="https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80"
                      alt="Wireless Ergonomic Mouse"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                      45 in stock
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="truncate">MX Master 3S</span>
                    <span className="text-indigo-300 font-bold">$99.99</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                    <span className="font-mono text-slate-400">SKU: ELEC-001</span>
                    <span className="text-emerald-400 font-medium">● Healthy</span>
                  </div>
                </div>

                {/* Product 2: Low Stock Warning */}
                <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-lg hover:border-white/30 transition-all group">
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-800 mb-2">
                    <img
                      src="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80"
                      alt="Mechanical Keyboard"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                      4 Low Stock
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="truncate">Pro Keyboard</span>
                    <span className="text-indigo-300 font-bold">$129.99</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                    <span className="font-mono text-slate-400">SKU: ELEC-003</span>
                    <span className="text-amber-300 font-medium">● Reorder Alert</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant automated inventory deductions on order checkout</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircleIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Automatic stock restoration when orders are cancelled</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircleIcon className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Strict role separation between Staff and Admin personnel</span>
              </div>
            </div>
          </div>

          {/* Bottom Reliability Tickers */}
          <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-base sm:text-lg font-extrabold text-white">99.9%</div>
              <div className="text-[10px] text-slate-400">Inventory Accuracy</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-extrabold text-indigo-400">&lt; 10ms</div>
              <div className="text-[10px] text-slate-400">Live Sync Speed</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-400">Zero</div>
              <div className="text-[10px] text-slate-400">Stock Drift</div>
            </div>
          </div>
        </div>

        {/* RIGHT HALF: Pure White Background Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
                <LockIcon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your credentials to access the inventory system
              </p>
            </div>

            {/* Error Alert Banner */}
            {(localError || error) && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 animate-fadeIn">
                <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="text-sm">
                  <span className="font-semibold block">Authentication Error</span>
                  <span>{localError || error}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <span className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-slate-600 cursor-pointer"
                >
                  Remember this device for 7 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
