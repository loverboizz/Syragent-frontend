import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Sparkles } from "lucide-react";

function RootContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authMode, setAuthMode] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#login") return "login";
      if (window.location.hash === "#register") return "register";
    }
    return null;
  });
  const [viewLandingLoggedIn, setViewLandingLoggedIn] = useState(false);

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

  // 1. If user is logged in
  if (isAuthenticated) {
    if (viewLandingLoggedIn) {
      return (
        <LandingPage
          isAuthenticated={true}
          onGoToDashboard={() => setViewLandingLoggedIn(false)}
          onLogin={() => setViewLandingLoggedIn(false)}
          onRegister={() => setViewLandingLoggedIn(false)}
        />
      );
    }
    return <DashboardPage onGoToLanding={() => setViewLandingLoggedIn(true)} />;
  }

  // 2. If user is not logged in:
  if (authMode === "login") {
    return (
      <LoginPage
        initialRegister={false}
        onBack={() => {
          setAuthMode(null);
          window.history.pushState(null, "", window.location.pathname);
        }}
      />
    );
  }

  if (authMode === "register") {
    return (
      <LoginPage
        initialRegister={true}
        onBack={() => {
          setAuthMode(null);
          window.history.pushState(null, "", window.location.pathname);
        }}
      />
    );
  }

  // Default for visitors: Landing Page!
  return (
    <LandingPage
      isAuthenticated={false}
      onGoToDashboard={() => setAuthMode("login")}
      onLogin={() => {
        setAuthMode("login");
        window.history.pushState(null, "", "#login");
      }}
      onRegister={() => {
        setAuthMode("register");
        window.history.pushState(null, "", "#register");
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
