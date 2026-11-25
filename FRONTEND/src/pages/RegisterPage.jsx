import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SpinnerIcon,
  ShieldCheckIcon,
} from "../components/Icons";

export const RegisterPage = ({ onSwitchToLogin }) => {
  const { register, error, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();

  const getStrengthLabel = () => {
    if (strength <= 25) return { label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (strength <= 50) return { label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
    if (strength <= 75) return { label: "Good", color: "bg-blue-500", text: "text-blue-500" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strengthInfo = getStrengthLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMessage("");
    clearError();

    if (!name.trim()) {
      setLocalError("Please enter your full name");
      return;
    }

    if (!email.trim()) {
      setLocalError("Please enter your email");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must contain at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage("Account created successfully! Redirecting...");
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-8 transition-all">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 ring-8 ring-indigo-50 dark:ring-indigo-950/30">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Join the Inventory Management System
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
            <CheckCircleIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {(localError || error) && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300">
            <AlertCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold block">Registration Error</span>
              <span>{localError || error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("STAFF")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === "STAFF"
                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    STAFF
                  </span>
                  {role === "STAFF" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Daily inventory ops, orders & stock movements
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  role === "ADMIN"
                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ADMIN
                  </span>
                  {role === "ADMIN" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Full administrative permissions & management
                </p>
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LockIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Password strength:</span>
                  <span className={`font-semibold ${strengthInfo.text}`}>
                    {strengthInfo.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                    style={{ width: `${strength}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LockIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword && password !== confirmPassword
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="w-5 h-5 text-white" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline cursor-pointer transition-colors"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

