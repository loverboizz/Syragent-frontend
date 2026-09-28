import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest, setAuthSession, clearAuthSession, getToken, getUser } from "../api/client";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      const [userData, companyData] = await Promise.all([
        apiRequest("/api/v1/auth/me"),
        apiRequest("/api/v1/companies/me"),
      ]);
      setUser(userData);
      setCompany(companyData);
      setAuthSession(token, userData);
    } catch (err) {
      console.error("Auth profile fetch error:", err);
      clearAuthSession();
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      setUser(null);
      setCompany(null);
      showToast("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "info");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [fetchProfile, showToast]);

  const login = async (email, password) => {
    const res = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      json: { email, password },
    });

    if (res.access_token) {
      setAuthSession(res.access_token, res.user);
      setUser(res.user);
      await fetchProfile();
      showToast(`Chào mừng ${res.user.full_name || res.user.email} trở lại!`, "success");
      return true;
    }
    return false;
  };

  const register = async ({ full_name, email, password, company_name }) => {
    const res = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      json: { full_name, email, password, company_name },
    });

    if (res.access_token) {
      setAuthSession(res.access_token, res.user);
      setUser(res.user);
      await fetchProfile();
      showToast(`Đăng ký thành công! Chào mừng công ty ${company_name}.`, "success");
      return true;
    }
    return false;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setCompany(null);
    showToast("Đã đăng xuất khỏi hệ thống.", "info");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

