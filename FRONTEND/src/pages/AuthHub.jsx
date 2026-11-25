import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  ShieldCheckIcon,
  LogOutIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  KeyIcon,
  SpinnerIcon,
  SparklesIcon,
} from "../components/Icons";

export const AuthHub = () => {
  const {
    user,
    token,
    isAdmin,
    logout,
    updateProfile,
    changePassword,
    testAdminAccess,
  } = useAuth();

  // Profile update state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Admin access test state
  const [adminTestResult, setAdminTestResult] = useState(null);
  const [testingAdmin, setTestingAdmin] = useState(false);

  // Copy token state
  const [copiedToken, setCopiedToken] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: "", type: "" });
    setIsUpdatingProfile(true);

    const res = await updateProfile({ name, email });
    setIsUpdatingProfile(false);

    if (res.success) {
      setProfileMsg({ text: "Profile updated successfully!", type: "success" });
    } else {
      setProfileMsg({ text: res.error, type: "error" });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });

    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: "Please fill in all password fields", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ text: "New password must be at least 8 characters", type: "error" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: "New passwords do not match", type: "error" });
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordMsg({ text: "Password changed successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } else {
      setPasswordMsg({ text: res.error, type: "error" });
    }
  };

  const handleTestAdmin = async () => {
    setTestingAdmin(true);
    setAdminTestResult(null);
    const result = await testAdminAccess();
    setTestingAdmin(false);
    setAdminTestResult(result);
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                    user?.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Session
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400">
                  ID: {user?.id || user?._id}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="self-start sm:self-center px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOutIcon className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Role Verification Test Card */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live RBAC Role Permission Check
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              Calls the protected endpoint <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded font-mono text-[11px] text-indigo-600 dark:text-indigo-300">GET /api/auth/admin-only</code> with your active token to verify server-side role enforcement.
            </p>
          </div>

          <button
            onClick={handleTestAdmin}
            disabled={testingAdmin}
            className="px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            {testingAdmin ? (
              <>
                <SpinnerIcon className="w-4 h-4 text-white" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 text-amber-300" />
                <span>Test Admin Route</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result Display */}
        {adminTestResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
              adminTestResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}
          >
            {adminTestResult.success ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">
                {adminTestResult.success
                  ? "200 OK — Admin Authorization Granted"
                  : `403 Forbidden — Access Restricted`}
              </span>
              <span>
                {adminTestResult.success
                  ? adminTestResult.message
                  : adminTestResult.error}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Profile & Password Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Update */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2.5 mb-4">
            <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Profile
            </h3>
          </div>

          {profileMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircleIcon className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? (
                <>
                  <SpinnerIcon className="w-4 h-4 text-white" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2.5 mb-4">
            <KeyIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Change Password
            </h3>
          </div>

          {passwordMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircleIcon className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isChangingPassword ? (
                <>
                  <SpinnerIcon className="w-4 h-4 text-white" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Active Token Inspector */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Active JWT Bearer Token
          </span>
          <button
            onClick={handleCopyToken}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {copiedToken ? "Copied!" : "Copy Token"}
          </button>
        </div>
        <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all">
          {token ? token : "No active token"}
        </div>
      </div>
    </div>
  );
};

