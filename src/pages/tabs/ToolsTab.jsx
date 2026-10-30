import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Search,
  Play,
  Edit2,
  Trash2,
  ShieldCheck,
  Zap,
  Ticket,
  RefreshCw,
  Sparkles,
  Eye,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { ToolModal } from "../../components/modals/ToolModal";
import { ToolTestModal } from "../../components/modals/ToolTestModal";

const BACKEND_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://syragent-backend.onrender.com";

const SAMPLE_TOOLS_LIST = [
  {
    id: "lookup_order",
    label: "lookup_order() — Tra cứu đơn hàng",
    method: "GET",
    endpoint: "/api/v1/sandbox/orders/{order_id}",
    sampleHint: "Mã mẫu: ORD-12345, ORD-67890, ORD-99999",
    template: {
      name: "lookup_order",
      description:
        "Tra cứu trạng thái đơn hàng, đơn vị vận chuyển và thời gian giao hàng dự kiến khi khách cung cấp mã đơn hàng.",
      http_method: "GET",
      endpoint_url: `${BACKEND_BASE}/api/v1/sandbox/orders/{order_id}`,
      action_type: "SYNC",
      is_active: true,
      parameters_schema: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Mã đơn hàng cần kiểm tra (VD: ORD-12345, ORD-67890, ORD-99999)",
          },
        },
        required: ["order_id"],
      },
    },
  },
  {
    id: "check_product_stock",
    label: "check_product_stock() — Kiểm tra tồn kho",
    method: "GET",
    endpoint: "/api/v1/sandbox/inventory/search",
    sampleHint: "Từ khóa: iPhone 16, MacBook Air M3, Samsung S24",
    template: {
      name: "check_product_stock",
      description:
        "Kiểm tra số lượng tồn kho, chi nhánh còn hàng và giá bán hiện tại của sản phẩm theo tên hoặc mã SKU.",
      http_method: "GET",
      endpoint_url: `${BACKEND_BASE}/api/v1/sandbox/inventory/search`,
      action_type: "SYNC",
      is_active: true,
      parameters_schema: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Tên hoặc mã sản phẩm khách đang hỏi (VD: iPhone 16, MacBook Air M3)",
          },
        },
        required: ["product_name"],
      },
    },
  },
  {
    id: "create_support_ticket",
    label: "create_support_ticket() — Tạo phiếu bảo hành",
    method: "POST",
    endpoint: "/api/v1/sandbox/tickets/create",
    sampleHint: "Tạo ticket tự động TCK-2026-XXXX",
    template: {
      name: "create_support_ticket",
      description:
        "Tạo phiếu yêu cầu hoàn tiền, đổi trả hoặc bảo hành cần nhân viên phê duyệt khi khách hàng khiếu nại.",
      http_method: "POST",
      endpoint_url: `${BACKEND_BASE}/api/v1/sandbox/tickets/create`,
      action_type: "ASYNC_TICKET",
      is_active: true,
      parameters_schema: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Mã đơn hàng liên quan (VD: ORD-12345)",
          },
          customer_phone: {
            type: "string",
            description: "Số điện thoại liên hệ của khách",
          },
          reason: {
            type: "string",
            description: "Lý do yêu cầu hoàn tiền hoặc bảo hành",
          },
        },
        required: ["order_id", "reason"],
      },
    },
  },
];

export function ToolsTab({ services = [], preselectedServiceId }) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    preselectedServiceId || services[0]?.id || ""
  );
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [noAgentWarning, setNoAgentWarning] = useState(false);

  // Selected sample tool from compact dropdown list
  const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_TOOLS_LIST[0].id);

  // Modals state
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [templateTool, setTemplateTool] = useState(null);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testingTool, setTestingTool] = useState(null);

  const { showToast } = useToast();

  const currentSample =
    SAMPLE_TOOLS_LIST.find((s) => s.id === selectedSampleId) || SAMPLE_TOOLS_LIST[0];

  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  const fetchTools = async () => {
    if (!selectedServiceId) return;
    setLoading(true);
    setNoAgentWarning(false);
    try {
      const data = await apiRequest(`/api/v1/services/${selectedServiceId}/tools`);
      setTools(data || []);
    } catch (err) {
      if (err.message && err.message.includes("chưa được khởi tạo AI Agent")) {
        setNoAgentWarning(true);
        setTools([]);
      } else {
        showToast(err.message || "Không thể tải danh sách công cụ", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [selectedServiceId]);

  const handleInitDefaultAgent = async () => {
    if (!selectedServiceId) return;
    try {
      await apiRequest("/api/v1/agents/", {
        method: "POST",
        json: {
          service_id: selectedServiceId,
          llm_provider: "google",
          model_name: "models/gemini-3.6-flash",
        },
      });
      showToast("Đã kích hoạt Trợ lý AI mặc định cho dịch vụ!", "success");
      fetchTools();
    } catch (err) {
      showToast(err.message || "Lỗi khi khởi tạo Agent", "error");
    }
  };

  const handleOpenCreate = () => {
    setEditingTool(null);
    setTemplateTool(null);
    setIsToolModalOpen(true);
  };

  const handleOpenSampleConfig = (tpl) => {
    setEditingTool(null);
    setTemplateTool(tpl);
    setIsToolModalOpen(true);
  };

  const handleTestSampleTool = (tpl) => {
    setTestingTool({ ...tpl, isSandboxSample: true });
    setIsTestModalOpen(true);
  };

  const handleOpenEdit = (tool) => {
    setEditingTool(tool);
    setTemplateTool(null);
    setIsToolModalOpen(true);
  };

  const handleOpenTest = (tool) => {
    setTestingTool(tool);
    setIsTestModalOpen(true);
  };

  const handleToggleActive = async (tool) => {
    try {
      const updated = await apiRequest(
        `/api/v1/services/${selectedServiceId}/tools/${tool.id}`,
        {
          method: "PUT",
          json: { is_active: !tool.is_active },
        }
      );
      setTools((prev) => prev.map((t) => (t.id === tool.id ? updated : t)));
      showToast(
        `Đã ${updated.is_active ? "bật" : "tạm tắt"} công cụ "${tool.name}"`,
        "success"
      );
    } catch (err) {
      showToast(err.message || "Không thể đổi trạng thái công cụ", "error");
    }
  };

  const handleDeleteTool = async (tool) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa công cụ "${tool.name}" khỏi AI Agent không?`
      )
    ) {
      return;
    }

    try {
      await apiRequest(
        `/api/v1/services/${selectedServiceId}/tools/${tool.id}`,
        { method: "DELETE" }
      );
      setTools((prev) => prev.filter((t) => t.id !== tool.id));
      showToast(`Đã xóa công cụ "${tool.name}"`, "success");
    } catch (err) {
      showToast(err.message || "Xóa công cụ thất bại", "error");
    }
  };

  const getMethodBadge = (method) => {
    const styles = {
      GET: "bg-sky-50 text-sky-700 border-sky-200",
      POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
      PUT: "bg-amber-50 text-amber-700 border-amber-200",
      DELETE: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-md border font-mono font-bold text-[10px] ${
          styles[method] || styles.GET
        }`}
      >
        {method}
      </span>
    );
  };

  const filteredTools = tools.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.endpoint_url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Compact Sandbox Sample Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Thư Viện Công Cụ Mẫu (Sandbox Demo)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                Chỉ dùng để chạy thử • Không gắn vào Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Chọn 1 công cụ mẫu bên phải để xem cấu trúc JSON Schema hoặc bấm chạy thử dữ liệu thật
            </p>
          </div>
        </div>

        {/* Select List + Quick Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <select
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all cursor-pointer"
            >
              {SAMPLE_TOOLS_LIST.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.method}] {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleTestSampleTool(currentSample.template)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title={currentSample.sampleHint}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Chạy Thử Mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSampleConfig(currentSample.template)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem Cấu Hình</span>
          </button>
        </div>
      </div>

      {/* Main Enterprise Real Tools Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Unified Card Header & Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm shadow-sky-600/20 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Công Cụ API Của AI Agent
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-[10px] font-bold">
                  {filteredTools.length} công cụ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Các REST API do doanh nghiệp đăng ký để AI tự động gọi khi trả lời khách hàng
              </p>
            </div>
          </div>

          {/* Right Toolbar: Service Selector + Search + Refresh + Create */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Service Dropdown */}
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none cursor-pointer"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  Dịch vụ: {s.name} ({s.code})
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hàm, URL..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchTools}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-600" : ""}`} />
            </button>

            {/* Create Tool Button */}
            <button
              onClick={handleOpenCreate}
              disabled={noAgentWarning || !selectedServiceId}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-sky-600/20 transition-all inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Công Cụ</span>
            </button>
          </div>
        </div>

        {/* Warning if Service has no Agent configured yet */}
        {noAgentWarning ? (
          <div className="p-8 text-center space-y-3 bg-amber-50/40">
            <p className="text-xs font-semibold text-amber-800">
              Dịch vụ này hiện chưa được khởi tạo Trợ lý AI nên chưa thể gắn công cụ.
            </p>
            <button
              onClick={handleInitDefaultAgent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kích Hoạt Trợ Lý AI Ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Tên Hàm & Mô Tả</th>
                  <th className="px-5 py-3">Endpoint API</th>
                  <th className="px-5 py-3">Cơ Chế</th>
                  <th className="px-5 py-3">Tham Số</th>
                  <th className="px-5 py-3">Trạng Thái</th>
                  <th className="px-5 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                      Đang tải danh sách công cụ...
                    </td>
                  </tr>
                ) : filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Chưa có công cụ API nào được gắn cho AI Agent
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Bấm <strong>"+ Thêm Công Cụ"</strong> ở góc phải trên để kết nối REST API của doanh nghiệp, hoặc chọn công cụ mẫu ở thanh trên để chạy thử.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool) => {
                    const paramNames = Object.keys(
                      tool.parameters_schema?.properties || {}
                    );
                    return (
                      <tr
                        key={tool.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="font-mono font-bold text-sky-700 text-xs">
                            {tool.name}()
                          </div>
                          <p
                            className="text-[11px] text-slate-500 line-clamp-1 mt-0.5"
                            title={tool.description}
                          >
                            {tool.description}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="flex items-center gap-2">
                            {getMethodBadge(tool.http_method)}
                            <code
                              className="font-mono text-[11px] text-slate-600 truncate"
                              title={tool.endpoint_url}
                            >
                              {tool.endpoint_url}
                            </code>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {tool.action_type === "ASYNC_TICKET" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-semibold">
                                <Ticket className="w-3 h-3" />
                                <span>ASYNC</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold">
                                <Zap className="w-3 h-3" />
                                <span>SYNC</span>
                              </span>
                            )}

                            {tool.has_headers && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-medium"
                                title="Headers được mã hóa Fernet"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Auth</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {paramNames.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Không có
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {paramNames.map((p) => (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 font-mono text-[10px] text-slate-600"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(tool)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                              tool.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tool.is_active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{tool.is_active ? "Đang bật" : "Tạm tắt"}</span>
                          </button>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenTest(tool)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Chạy thử API này"
                            >
                              <Play className="w-3 h-3" />
                              <span>Test</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tool)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTool(tool)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ToolModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        serviceId={selectedServiceId}
        editingTool={editingTool}
        initialTemplate={templateTool}
        onSuccess={fetchTools}
        onTestSample={handleTestSampleTool}
      />

      <ToolTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        serviceId={selectedServiceId}
        tool={testingTool}
      />
    </div>
  );
}
