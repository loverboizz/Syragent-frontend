import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Sparkles } from "lucide-react";

function RootContent() {
  const { isAuthenticated, loading } = useAuth();

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

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
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
