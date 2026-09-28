import React, { useState, useEffect, useRef } from "react";
import { Bot, Sparkles, Key, Eye, EyeOff, Save, CheckCircle2, Sliders, Shield } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function AgentConfigTab({ services = [], preselectedServiceId, onConfigSaved }) {
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || (services[0]?.id || ""));
  const [agentId, setAgentId] = useState("");
  const [aiTier, setAiTier] = useState("FREE");
  const [llmProvider, setLlmProvider] = useState("google");
  const [modelName, setModelName] = useState("models/gemini-3.6-flash");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
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

    // Check cache first for 0ms instant display
    const cached = agentCacheRef.current[selectedServiceId];
    if (cached) {
      setAgentId(cached.id || "");
      setAiTier(cached.ai_tier || "FREE");
      setLlmProvider(cached.llm_provider || "google");
      setModelName(cached.model_name || "models/gemini-3.6-flash");
      setSystemPrompt(cached.system_prompt || "");
      setTemperature(cached.temperature !== undefined ? cached.temperature : 0.3);
      setApiKey("");
      return;
    }

    async function loadAgentConfig() {
      setLoading(true);
      try {
        const srv = await apiRequest(`/api/v1/services/${selectedServiceId}`);
        if (srv.agent) {
          const cfg = {
            id: srv.agent.id,
            ai_tier: srv.agent.ai_tier || "FREE",
            llm_provider: srv.agent.llm_provider || "google",
            model_name: srv.agent.model_name || "models/gemini-3.6-flash",
            system_prompt: srv.agent.system_prompt || "",
            temperature: srv.agent.temperature !== undefined ? srv.agent.temperature : 0.3,
          };
          agentCacheRef.current[selectedServiceId] = cfg;
          setAgentId(cfg.id);
          setAiTier(cfg.ai_tier);
          setLlmProvider(cfg.llm_provider);
          setModelName(cfg.model_name);
          setSystemPrompt(cfg.system_prompt);
          setTemperature(cfg.temperature);
          setApiKey("");
        } else {
          const cfg = {
            id: "",
            ai_tier: "FREE",
            llm_provider: "google",
            model_name: "models/gemini-3.6-flash",
            system_prompt: "",
            temperature: 0.3,
          };
          agentCacheRef.current[selectedServiceId] = cfg;
          setAgentId("");
          setAiTier("FREE");
          setLlmProvider("google");
          setModelName("models/gemini-3.6-flash");
          setSystemPrompt("");
          setTemperature(0.3);
          setApiKey("");
        }
      } catch (err) {
        showToast("Lỗi khi tải cấu hình Agent", "error");
      } finally {
        setLoading(false);
      }
    }

    loadAgentConfig();
  }, [selectedServiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    setSaving(true);
    try {
      let finalAgentId = agentId;
      if (agentId) {
        // Update existing agent
        const payload = {
          ai_tier: aiTier,
          llm_provider: llmProvider,
          model_name: modelName,
          system_prompt: systemPrompt,
          temperature: parseFloat(temperature),
        };
        if (aiTier === "BYOK" && apiKey.trim()) {
          payload.api_key = apiKey.trim();
        }

        await apiRequest(`/api/v1/agents/${agentId}`, {
          method: "PATCH",
          json: payload,
        });
        showToast("Đã lưu cập nhật Trợ lý AI thành công!", "success");
      } else {
        // Create new agent
        const payload = {
          service_id: selectedServiceId,
          ai_tier: aiTier,
          llm_provider: llmProvider,
          model_name: modelName,
          system_prompt: systemPrompt,
          temperature: parseFloat(temperature),
        };
        if (aiTier === "BYOK" && apiKey.trim()) {
          payload.api_key = apiKey.trim();
        }

        const newAgent = await apiRequest("/api/v1/agents/", {
          method: "POST",
          json: payload,
        });
        finalAgentId = newAgent.id;
        setAgentId(newAgent.id);
        showToast("Đã khởi tạo Trợ lý AI thành công!", "success");
      }

      // Update cache
      agentCacheRef.current[selectedServiceId] = {
        id: finalAgentId,
        ai_tier: aiTier,
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
        <h3 className="text-base font-bold text-slate-800">Cấu Hình Trợ Lý AI & Khóa API</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh mô hình LLM, chọn gói FREE hệ thống tài trợ hoặc nhập khóa riêng (BYOK)
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
            {/* AI Tier Visual Radio Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Gói Cước AI (Tier)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FREE Tier Card */}
                <div
                  onClick={() => setAiTier("FREE")}
                  className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${aiTier === "FREE"
                    ? "border-sky-600 bg-sky-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <span>Gói Miễn Phí (FREE)</span>
                    </span>
                    <input
                      type="radio"
                      name="ai_tier"
                      checked={aiTier === "FREE"}
                      onChange={() => setAiTier("FREE")}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sử dụng Google Gemini 3.6 Flash tốc độ cao được tài trợ sẵn bởi nền tảng. Không cần thẻ tín dụng.
                  </p>
                </div>

                {/* BYOK Tier Card */}
                <div
                  onClick={() => setAiTier("BYOK")}
                  className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${aiTier === "BYOK"
                    ? "border-sky-600 bg-sky-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>Tự Cung Cấp Khóa (BYOK)</span>
                    </span>
                    <input
                      type="radio"
                      name="ai_tier"
                      checked={aiTier === "BYOK"}
                      onChange={() => setAiTier("BYOK")}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Dùng khóa API riêng của doanh nghiệp (OpenAI GPT-4o hoặc Gemini Pro). Mã hóa AES-256 an toàn.
                  </p>
                </div>
              </div>
            </div>

            {/* BYOK Specific Inputs */}
            {aiTier === "BYOK" && (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nhà Cung Cấp LLM
                    </label>
                    <select
                      value={llmProvider}
                      onChange={(e) => {
                        setLlmProvider(e.target.value);
                        setModelName(
                          e.target.value === "openai" ? "gpt-4o-mini" : "models/gemini-3.6-flash"
                        );
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="google">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tên Mô Hình (Model Name)
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder={llmProvider === "openai" ? "gpt-4o hoặc gpt-4o-mini" : "models/gemini-3.6-flash"}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khóa API Bí Mật (API Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-... (OpenAI) hoặc AIzaSy... (Gemini)"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600 inline" />
                    <span>Khóa được mã hóa AES-256 an toàn và chỉ giải mã trên bộ nhớ RAM khi inference.</span>
                  </p>
                </div>
              </div>
            )}

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
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
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

