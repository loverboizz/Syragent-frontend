import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Sparkles } from "lucide-react";

function getNormalizedRoute() {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path === "/dashboard" || hash === "#dashboard") return "/dashboard";
  if (path === "/login" || hash === "#login") return "/login";
  if (path === "/register" || hash === "#register") return "/register";
  return "/";
}

function RootContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState(getNormalizedRoute);

  // Navigate helper with clean pushState
  const navigate = useCallback((toRoute, replace = false) => {
    if (typeof window !== "undefined") {
      if (replace) {
        window.history.replaceState(null, "", toRoute);
      } else {
        window.history.pushState(null, "", toRoute);
      }
    }
    setCurrentRoute(toRoute);
  }, []);

  // Listen for browser back / forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getNormalizedRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync route with authentication state
  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      // If user just logged in or is logged in while viewing /login, /register, or lingering #login
      if (
        currentRoute === "/login" ||
        currentRoute === "/register" ||
        (typeof window !== "undefined" && (window.location.hash === "#login" || window.location.hash === "#register"))
      ) {
        navigate("/dashboard", true);
      }
    } else {
      // If unauthenticated user tries to directly access /dashboard
      if (currentRoute === "/dashboard") {
        navigate("/login", true);
      }
    }
  }, [isAuthenticated, loading, currentRoute, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/30 animate-pulse mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase animate-pulse">
          Đang khởi tạo phiên làm việc...
        </p>
      </div>
    );
  }

  // 1. If currently on /dashboard
  if (isAuthenticated && currentRoute === "/dashboard") {
    return <DashboardPage onGoToLanding={() => navigate("/")} />;
  }

  // 2. If unauthenticated on /login
  if (currentRoute === "/login") {
    return (
      <LoginPage
        initialRegister={false}
        onBack={() => navigate("/")}
      />
    );
  }

  // 3. If unauthenticated on /register
  if (currentRoute === "/register") {
    return (
      <LoginPage
        initialRegister={true}
        onBack={() => navigate("/")}
      />
    );
  }

  // 4. Default: Landing Page (both for guests and for logged-in users who visit "/")
  return (
    <LandingPage
      isAuthenticated={isAuthenticated}
      onGoToDashboard={() => navigate("/dashboard")}
      onLogin={() => {
        if (isAuthenticated) {
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      }}
      onRegister={() => {
        if (isAuthenticated) {
          navigate("/dashboard");
        } else {
          navigate("/register");
        }
      }}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </ToastProvider>
  );
}
