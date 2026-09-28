import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Code2,
  Bot,
  BookOpen,
  PauseCircle,
  PlayCircle,
  Globe,
  CheckCircle2,
  AlertCircle,
  Palette,
  MessagesSquare,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function ServicesTab({
  services: externalServices,
  loading: externalLoading,
  onReloadServices,
  onOpenCreate,
  onOpenEdit,
  onOpenEmbed,
  onGoToAgent,
  onGoToKnowledge,
  onGoToWidget,
  onGoToConversations,
}) {
  const [internalServices, setInternalServices] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const { showToast } = useToast();

  const services = externalServices !== undefined ? externalServices : internalServices;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const reload = async () => {
    if (onReloadServices) {
      await onReloadServices();
    } else {
      try {
        setInternalLoading(true);
        const data = await apiRequest("/api/v1/services/");
        setInternalServices(data || []);
      } catch (err) {
        showToast(err.message || "Không thể tải danh sách dịch vụ", "error");
      } finally {
        setInternalLoading(false);
      }
    }
  };

  useEffect(() => {
    if (externalServices === undefined) {
      reload();
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(".service-action-dropdown-container")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const handleToggleStatus = async (service) => {
    const newStatus = !service.is_active;
    const actionText = newStatus ? "kích hoạt lại" : "tạm dừng";
    const confirmMsg = newStatus
      ? `Bạn có chắc chắn muốn kích hoạt lại dịch vụ "${service.name}"?\nChatbot Widget trên landing page sẽ bắt đầu phục vụ khách hàng trở lại.`
      : `Bạn có chắc chắn muốn tạm dừng dịch vụ "${service.name}"?\nKhi tạm dừng, Chatbot Widget sẽ ngưng phục vụ khách hàng.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (newStatus) {
        await apiRequest(`/api/v1/services/${service.id}`, {
          method: "PATCH",
          json: { is_active: true },
        });
        showToast(`Đã kích hoạt lại dịch vụ "${service.name}" thành công!`, "success");
      } else {
        await apiRequest(`/api/v1/services/${service.id}`, { method: "DELETE" });
        showToast(`Đã tạm dừng dịch vụ "${service.name}"!`, "success");
      }
      reload();
    } catch (err) {
      showToast(err.message || `Lỗi khi ${actionText} dịch vụ`, "error");
    }
  };

  const filteredServices = services.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.service_url && s.service_url.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Quản Lý Danh Sách Dịch Vụ</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi dịch vụ sở hữu 1 Trợ lý AI và 1 mã nhúng script độc lập để gắn vào website
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm dịch vụ, slug..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300/80 bg-white text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ Mới</span>
          </button>
        </div>
      </div>

      {/* Main Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-visible">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Tên Dịch Vụ</th>
                <th className="px-6 py-3.5">Mã Dịch Vụ</th>
                <th className="px-6 py-3.5">Website Whitelist</th>
                <th className="px-6 py-3.5">Cấu Hình AI</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
                <th className="px-6 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Đang tải danh sách dịch vụ...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {search ? "Không tìm thấy dịch vụ phù hợp với từ khóa." : "Chưa có dịch vụ nào được tạo."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => {
                  const tier = s.agent ? s.agent.ai_tier : "Chưa có";
                  const isDropdownOpen = openDropdownId === s.id;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-xs">{s.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Tạo ngày: {new Date(s.created_at).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sky-700">{s.code}</td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-slate-600 font-mono text-[11px]" title={s.service_url}>
                        {s.service_url}
                      </td>
                      <td className="px-6 py-4">
                        {tier === "FREE" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            FREE (Gemini Flash)
                          </span>
                        ) : tier === "BYOK" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            BYOK ({s.agent?.model_name || "Custom"})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Chưa tạo Agent</span>
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
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left service-action-dropdown-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isDropdownOpen ? null : s.id);
                            }}
                            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            title="Tùy chọn thao tác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onOpenEdit(s);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Chỉnh sửa dịch vụ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onOpenEmbed(s);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <Code2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Lấy mã nhúng Widget</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    if (onGoToWidget) onGoToWidget(s.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Tùy biến Giao diện Widget</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    if (onGoToConversations) onGoToConversations(s.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <MessagesSquare className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Xem các cuộc trò chuyện</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onGoToAgent(s.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <Bot className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Cấu hình Trợ lý AI</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    onGoToKnowledge(s.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Nạp & Quản lý tri thức</span>
                                </button>
                              </div>

                              <div className="py-1">
                                {s.is_active ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleToggleStatus(s);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    <span>Tạm dừng dịch vụ</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenDropdownId(null);
                                      handleToggleStatus(s);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Kích hoạt lại dịch vụ</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
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

