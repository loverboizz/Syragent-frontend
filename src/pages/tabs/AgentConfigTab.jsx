import React, { useState, useEffect, useRef } from "react";
import { Bot, Sparkles, Save, CheckCircle2, Sliders, Shield, Cpu, Zap } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export const MANAGED_MODELS = [
  {
    provider: "google",
    providerLabel: "Google DeepMind",
    modelName: "models/gemini-3.6-flash",
    displayName: "Gemini 3.6 Flash",
    badge: "Mặc định • Tốc độ cao",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    description: "Tối ưu cho hội thoại RAG thời gian thực và thực thi ReAct Action Gateway với độ trễ cực thấp.",
  },
  {
    provider: "google",
    providerLabel: "Google DeepMind",
    modelName: "models/gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro",
    badge: "Suy luận chuyên sâu",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Phân tích tài liệu kỹ thuật phức tạp, suy luận đa bước và độ chính xác ngữ nghĩa vượt trội.",
  },
  {
    provider: "openai",
    providerLabel: "OpenAI",
    modelName: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    badge: "Phản hồi nhanh",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Mô hình gọn nhẹ của OpenAI, phản hồi mượt mà cho các tác vụ chăm sóc khách hàng đa ngôn ngữ.",
  },
  {
    provider: "openai",
    providerLabel: "OpenAI",
    modelName: "gpt-4o",
    displayName: "GPT-4o Flagship",
    badge: "Đa năng cao cấp",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Mô hình flagship của OpenAI với khả năng tổng hợp thông tin và tuân thủ chỉ thị xuất sắc.",
  },
  {
    provider: "anthropic",
    providerLabel: "Anthropic",
    modelName: "claude-3-5-sonnet-latest",
    displayName: "Claude 3.5 Sonnet",
    badge: "Văn phong tự nhiên",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Nổi bật với văn phong tư vấn tự nhiên, lịch sự và bám sát tuyệt đối ngữ cảnh tài liệu.",
  },
  {
    provider: "deepseek",
    providerLabel: "DeepSeek AI",
    modelName: "deepseek-chat",
    displayName: "DeepSeek V3",
    badge: "Hiệu năng cao",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Mô hình ngôn ngữ lớn thế hệ mới tối ưu cho bài toán phân tích dữ liệu và hỏi đáp nghiệp vụ.",
  },
];

export function AgentConfigTab({ services = [], preselectedServiceId, onConfigSaved }) {
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || (services[0]?.id || ""));
  const [agentId, setAgentId] = useState("");
  const [llmProvider, setLlmProvider] = useState("google");
  const [modelName, setModelName] = useState("models/gemini-3.6-flash");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const agentCacheRef = useRef({});
  const { showToast } = useToast();

  // Update selectedServiceId if not set and services arrived
  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Update when preselectedServiceId changes
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  // Load agent for selected service with Cache
  useEffect(() => {
    if (!selectedServiceId) return;

    const cached = agentCacheRef.current[selectedServiceId];
    if (cached) {
      setAgentId(cached.id || "");
      setLlmProvider(cached.llm_provider || "google");
      setModelName(cached.model_name || "models/gemini-3.6-flash");
      setSystemPrompt(cached.system_prompt || "");
      setTemperature(cached.temperature !== undefined ? cached.temperature : 0.3);
      return;
    }

    async function loadAgentConfig() {
      setLoading(true);
      try {
        const srv = await apiRequest(`/api/v1/services/${selectedServiceId}`);
        if (srv.agent) {
          const cfg = {
            id: srv.agent.id,
            llm_provider: srv.agent.llm_provider || "google",
            model_name: srv.agent.model_name || "models/gemini-3.6-flash",
            system_prompt: srv.agent.system_prompt || "",
            temperature: srv.agent.temperature !== undefined ? srv.agent.temperature : 0.3,
          };
          agentCacheRef.current[selectedServiceId] = cfg;
          setAgentId(cfg.id);
          setLlmProvider(cfg.llm_provider);
          setModelName(cfg.model_name);
          setSystemPrompt(cfg.system_prompt);
          setTemperature(cfg.temperature);
        } else {
          const cfg = {
            id: "",
            llm_provider: "google",
            model_name: "models/gemini-3.6-flash",
            system_prompt: "",
            temperature: 0.3,
          };
          agentCacheRef.current[selectedServiceId] = cfg;
          setAgentId("");
          setLlmProvider("google");
          setModelName("models/gemini-3.6-flash");
          setSystemPrompt("");
          setTemperature(0.3);
        }
      } catch (err) {
        showToast("Lỗi khi tải cấu hình Agent", "error");
      } finally {
        setLoading(false);
      }
    }

    loadAgentConfig();
  }, [selectedServiceId]);

  const handleSelectManagedModel = (m) => {
    setLlmProvider(m.provider);
    setModelName(m.modelName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    setSaving(true);
    try {
      let finalAgentId = agentId;
      if (agentId) {
        const payload = {
          llm_provider: llmProvider,
          model_name: modelName,
        };

        await apiRequest(`/api/v1/agents/${agentId}`, {
          method: "PATCH",
          json: payload,
        });
        showToast("Đã lưu cập nhật Trợ lý AI thành công!", "success");
      } else {
        const payload = {
          service_id: selectedServiceId,
          llm_provider: llmProvider,
          model_name: modelName,
        };

        const newAgent = await apiRequest("/api/v1/agents/", {
          method: "POST",
          json: payload,
        });
        finalAgentId = newAgent.id;
        setAgentId(newAgent.id);
        showToast("Đã khởi tạo Trợ lý AI thành công!", "success");
      }

      agentCacheRef.current[selectedServiceId] = {
        id: finalAgentId,
        llm_provider: llmProvider,
        model_name: modelName,
        system_prompt: systemPrompt,
        temperature: parseFloat(temperature),
      };

      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      showToast(err.message || "Không thể lưu cấu hình Agent", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-base font-bold text-slate-800">Cấu Hình Mô Hình & Trợ Lý AI</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Lựa chọn mô hình ngôn ngữ lớn (LLM) được cung cấp trực tiếp bởi hạ tầng Syragent Managed AI
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        {/* Service Selector Dropdown */}
        <div className="mb-7 pb-6 border-b border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Chọn Dịch Vụ Cần Cấu Hình AI
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải thông số Agent...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Managed AI Infrastructure Notice */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Hạ Tầng Syragent Managed AI (Tập Trung & Bảo Mật)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Toàn bộ kết nối LLM, định tuyến ReAct Action Gateway và bảo mật khóa truy cập đều được quản lý trực tiếp bởi nền tảng Syragent. Doanh nghiệp chỉ cần chọn mô hình phù hợp nhất cho nghiệp vụ của mình.
                </p>
              </div>
            </div>

            {/* Managed Models Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Chọn Mô Hình Ngôn Ngữ Lớn (Syragent AI Catalog)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MANAGED_MODELS.map((m) => {
                  const isSelected = modelName === m.modelName;
                  return (
                    <div
                      key={m.modelName}
                      onClick={() => handleSelectManagedModel(m)}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/40 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Cpu className={`w-4 h-4 ${isSelected ? "text-sky-600" : "text-slate-400"}`} />
                          <div>
                            <span className="font-bold text-xs text-slate-800 block leading-tight">
                              {m.displayName}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {m.providerLabel}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                        {m.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{m.modelName}</span>
                        {isSelected && (
                          <span className="text-sky-600 font-sans font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đang chọn
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chỉ Đạo Hệ Thống (System Prompt / Persona)
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Bạn là chuyên viên tư vấn chuyên nghiệp đại diện cho dịch vụ của công ty. Hãy trả lời lịch sự, chính xác và bám sát tài liệu..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hướng dẫn ngữ cảnh, cách xưng hô và phạm vi trả lời của Trợ lý AI.
              </p>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-600" />
                  <span>Độ Sáng Tạo (Temperature: {temperature})</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {temperature < 0.3 ? "Rất chính xác (khuyên dùng)" : temperature > 0.7 ? "Sáng tạo" : "Cân bằng"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full accent-sky-600 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Đang lưu..." : "Lưu Cấu Hình Trợ Lý AI"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
