// src/api/client.js
// In development, leave API_BASE_URL empty so requests use a relative path
// (e.g. "/auth/me") which is forwarded by the Vite dev-server proxy to
// http://localhost:8000. This avoids any cross-origin CORS issue.
// In production, set VITE_API_BASE_URL to your deployed API origin.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Creates an authenticated fetch client using the Clerk getToken function.
 */
export const createApiClient = (getToken) => {
  const request = async (endpoint, options = {}) => {
    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.error || "An API error occurred");
    }

    return response.json();
  };

  return {
    get: (endpoint) => request(endpoint, { method: "GET" }),
    post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  };
};
