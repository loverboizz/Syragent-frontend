/**
 * API Client & Token Management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "ai_agent_jwt_token";
const USER_KEY = "ai_agent_user_info";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const data = localStorage.getItem(USER_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (options.json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Parse JSON or text
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      let errorMsg = "Yêu cầu máy chủ thất bại.";
      if (typeof data === "object" && data !== null) {
        if (typeof data.detail === "string") errorMsg = data.detail;
        else if (Array.isArray(data.detail)) errorMsg = data.detail.map((e) => e.msg || JSON.stringify(e)).join(", ");
        else if (data.message) errorMsg = data.message;
      } else if (typeof data === "string" && data.trim()) {
        errorMsg = data;
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
      throw new Error(`Không thể kết nối đến máy chủ Backend (${API_BASE_URL}). Vui lòng đảm bảo server đang chạy.`);
    }
    throw err;
  }
}

export { API_BASE_URL };

