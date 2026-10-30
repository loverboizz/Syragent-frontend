import React from "react";
import { Layers, Database, Cpu, Activity, ArrowRight, Plus, Code2, Sparkles } from "lucide-react";

export function OverviewTab({ services = [], stats = null, loading = false, onOpenCreateService, onOpenEmbed, onSwitchTab }) {
  const totalServices = stats?.total_services ?? services.length;
  const activeServicesCount = stats?.active_services ?? services.filter((s) => s.is_active).length;
  const totalChunks = stats?.total_chunks ?? 0;

  return (
    <div className="space-y-7">
      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Dịch Vụ</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalServices}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{activeServicesCount} đang hoạt động</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đoạn Tri Thức (Chunks)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalChunks}</h3>
            <p className="text-[11px] text-sky-600 font-medium mt-0.5">Vector embeddings pgvector</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hạ Tầng AI</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1.5">Syragent AI</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Gemini / GPT-4o / Claude / DeepSeek</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng Thái RAG API</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              99.9% Uptime
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">SSE Streaming real-time</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Launch Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-sky-700/40">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-200 text-[11px] font-semibold border border-sky-400/30 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quy Trình 3 Bước Tự Động Hóa</span>
          </div>
          <h3 className="text-lg font-bold">Kích Hoạt Chatbot AI Cho Website Của Bạn Ngay Hôm Nay</h3>
          <p className="text-sky-100 text-xs sm:text-sm mt-1 leading-relaxed max-w-2xl">
            1. Tạo Dịch vụ $\rightarrow$ 2. Tải tài liệu hướng dẫn lên Kho Tri thức (.docx, .xlsx, .pdf) $\rightarrow$ 3. Copy mã nhúng dán vào website.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={onOpenCreateService}
            className="px-4 py-2.5 bg-white text-sky-900 font-bold text-xs rounded-xl hover:bg-sky-50 shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Dịch Vụ Mới</span>
          </button>
          <button
            onClick={() => onSwitchTab("knowledge")}
            className="px-4 py-2.5 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-400/40 text-white font-semibold text-xs rounded-xl shadow transition-all"
          >
            Nạp Kho Tri Thức &rarr;
          </button>
        </div>
      </div>

      {/* Recent Services Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Dịch Vụ Đang Vận Hành</h3>
            <p className="text-xs text-slate-400">Danh sách các Trợ lý AI và mã nhúng widget tương ứng</p>
          </div>
          <button
            onClick={() => onSwitchTab("services")}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Tên Dịch Vụ</th>
                <th className="px-6 py-3.5">Mã Slug</th>
                <th className="px-6 py-3.5">Mô Hình AI</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
                <th className="px-6 py-3.5 text-right">Mã Nhúng Widget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Đang tải dữ liệu tổng quan...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Doanh nghiệp chưa có dịch vụ nào. Hãy bấm "Tạo Dịch Vụ Mới" ở trên.
                  </td>
                </tr>
              ) : (
                services.slice(0, 5).map((s) => {
                  const rawModel = s.agent?.model_name || "";
                  const cleanModel = rawModel.replace(/^models\//, "");
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sky-700">{s.code}</td>
                      <td className="px-6 py-4">
                        {s.agent ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            {cleanModel || "gemini-3.6-flash"}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onOpenEmbed(s)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold rounded-lg border border-slate-200 transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Lấy mã nhúng</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

