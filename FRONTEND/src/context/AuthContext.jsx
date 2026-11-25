import React, { createContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("ims_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("ims_token") || null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify existing token
  useEffect(() => {
    const verifyExistingAuth = async () => {
      const storedToken = localStorage.getItem("ims_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getProfile();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("ims_user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn("Session expired or invalid token:", err.message);
        localStorage.removeItem("ims_token");
        localStorage.removeItem("ims_user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyExistingAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.data) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem("ims_token", receivedToken);
        localStorage.setItem("ims_user", JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      throw new Error(res.message || "Login failed");
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async ({ name, email, password, role }) => {
    setError(null);
    try {
      const res = await api.auth.register({ name, email, password, role });
      if (res.success && res.data) {
        const { token: receivedToken, user: receivedUser } = res.data;
        if (receivedToken) {
          setToken(receivedToken);
          setUser(receivedUser);
          localStorage.setItem("ims_token", receivedToken);
          localStorage.setItem("ims_user", JSON.stringify(receivedUser));
        }
        return { success: true, user: receivedUser };
      }
      throw new Error(res.message || "Registration failed");
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setToken(null);
    setUser(null);
    setError(null);
  };

  const updateProfile = async ({ name, email }) => {
    try {
      const res = await api.auth.updateProfile({ name, email });
      if (res.success && res.data?.user) {
        const updated = { ...user, ...res.data.user };
        setUser(updated);
        localStorage.setItem("ims_user", JSON.stringify(updated));
        return { success: true, user: updated };
      }
      throw new Error(res.message || "Failed to update profile");
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success && res.data?.token) {
        setToken(res.data.token);
        localStorage.setItem("ims_token", res.data.token);
        return { success: true };
      }
      throw new Error(res.message || "Failed to change password");
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const testAdminAccess = async () => {
    try {
      const res = await api.auth.checkAdminOnly();
      return { success: true, message: res.message, data: res.data };
    } catch (err) {
      return {
        success: false,
        status: err.status || 403,
        error: err.message || "Forbidden: ADMIN privileges required",
      };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === "ADMIN",
    loading,
    error,
    clearError: () => setError(null),
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    testAdminAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

