const API_BASE_URL = "http://localhost:8000/api";

const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = localStorage.getItem("ims_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "Invalid JSON response from server" };
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },

    register: async ({ name, email, password, role }) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify({ name, email, password, role }),
      });
      return handleResponse(response);
    },

    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    updateProfile: async ({ name, email }) => {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ name, email }),
      });
      return handleResponse(response);
    },

    changePassword: async (currentPassword, newPassword) => {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return handleResponse(response);
    },

    checkAdminOnly: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/admin-only`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    logout: async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: getHeaders(false),
        });
      } catch {
        // Ignore logout errors
      }
      localStorage.removeItem("ims_token");
      localStorage.removeItem("ims_user");
    },
  },

  dashboard: {
    getOverview: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getSales: async (period = "daily") => {
      const response = await fetch(`${API_BASE_URL}/dashboard/sales?period=${period}`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getInventory: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/inventory`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getTopProducts: async (limit = 5, days = 30) => {
      const response = await fetch(`${API_BASE_URL}/dashboard/top-products?limit=${limit}&days=${days}`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getCategories: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/categories`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },
  },

  inventory: {
    getLevels: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/inventory/levels${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getAlerts: async () => {
      const response = await fetch(`${API_BASE_URL}/inventory/alerts`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    adjustStock: async ({ product, type, quantity, reason, reference }) => {
      const response = await fetch(`${API_BASE_URL}/inventory/adjust`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({ product, type, quantity, reason, reference }),
      });
      return handleResponse(response);
    },
  },

  orders: {
    getOrders: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/orders${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    getStats: async () => {
      const response = await fetch(`${API_BASE_URL}/orders/stats`, {
        method: "GET",
        headers: getHeaders(true),
      });
      return handleResponse(response);
    },

    updateStatus: async (orderId, status) => {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ status }),
      });
      return handleResponse(response);
    },
  },
};
