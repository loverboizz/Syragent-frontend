import React from "react";
import { Activity, Server, RefreshCw } from "lucide-react";

const TAB_METADATA = {
  overview: { title: "Tổng Quan Hệ Thống", subtitle: "Bảng chỉ số vận hành và các dịch vụ đang hoạt động" },
  services: { title: "Quản Lý Dịch Vụ", subtitle: "Danh sách dịch vụ chuyên sâu và mã nhúng script độc lập" },
  conversations: { title: "Quản Lý Cuộc Trò Chuyện", subtitle: "Theo dõi tương tác của khách hàng, câu trả lời của AI và tài liệu trích dẫn" },
  widget: { title: "Tùy Biến Giao Diện Widget", subtitle: "Cá nhân hóa màu sắc thương hiệu, tên trợ lý, avatar và câu chào mở đầu" },
  agents: { title: "Cấu Hình Trợ Lý AI", subtitle: "Lựa chọn gói cước (FREE/BYOK), tinh chỉnh mô hình và prompt hệ thống" },
  tools: { title: "Công Cụ & Hành Động (ReAct)", subtitle: "Cấu hình REST API ngoại vi, kiểm định JSON Schema và thử nghiệm Action Gateway" },
  knowledge: { title: "Kho Tri Thức & RAG", subtitle: "Nạp tài liệu Word, Excel, PDF và quản lý dữ liệu vector hóa" },
  users: { title: "Phân Quyền Nhân Sự", subtitle: "Danh sách quản trị viên và tài khoản vận hành phụ (Sub-Admin)" },
};

export function Header({ activeTab, onRefresh, isRefreshing }) {
  const meta = TAB_METADATA[activeTab] || TAB_METADATA.overview;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between shrink-0 shadow-sm/50">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{meta.title}</h2>
          <span className="text-slate-300">|</span>
          <p className="text-xs text-slate-500 font-medium">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Manual Refresh / Sync Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            title="Đồng bộ dữ liệu mới nhất từ máy chủ"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>
        )}

        {/* Backend Online Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>FastAPI + Supabase RAG</span>
        </div>
      </div>
    </header>
  );
}

