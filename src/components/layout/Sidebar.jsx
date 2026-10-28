import React from "react";
import { LayoutDashboard, Layers, Bot, BookOpen, Users, LogOut, Sparkles, ShieldCheck, Palette, MessagesSquare, Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ activeTab, onSelectTab }) {
  const { user, company, logout } = useAuth();

  const navItems = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "services", label: "Quản lý Dịch vụ", icon: Layers },
    { id: "conversations", label: "Cuộc trò chuyện", icon: MessagesSquare },
    { id: "widget", label: "Giao diện Widget", icon: Palette },
    { id: "agents", label: "Cấu hình Trợ lý AI", icon: Bot },
    { id: "tools", label: "Công cụ & Hành động", icon: Wrench },
    { id: "knowledge", label: "Kho Tri thức & RAG", icon: BookOpen },
  ];

  if (user?.role === "SUPER_ADMIN") {
    navItems.push({ id: "users", label: "Phân quyền Nhân sự", icon: Users });
  }

  const userInitial = (user?.full_name || user?.email || "U")[0].toUpperCase();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Syragent</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                AI SaaS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]" title={company?.name}>
              {company?.name || "Doanh Nghiệp"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Menu Quản Trị
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${isActive
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25 border border-sky-500/30"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80"
                }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate" title={user?.full_name || user?.email}>
                {user?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                <span>{user?.role}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
                logout();
              }
            }}
            title="Đăng xuất"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

