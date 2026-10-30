import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  Save,
  CheckCircle2,
  Sliders,
  Shield,
  Cpu,
  Send,
  RotateCcw,
  FileText,
  Zap,
  Layers,
  MessageSquare,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export const MANAGED_MODELS = [
  {
    provider: "google",
    providerLabel: "Google DeepMind",
    modelName: "models/gemini-3.6-flash",
    displayName: "Gemini 3.6 Flash",
    badge: "Mặc định • Tốc độ cao",
    contextWindow: "1,000,000 tokens",
    latency: "Siêu nhanh (~0.6s)",
    capabilities: "RAG, ReAct Tool Calling, Đa ngôn ngữ",
    description: "Tối ưu cho hội thoại RAG thời gian thực và thực thi ReAct Action Gateway với độ trễ cực thấp.",
  },
  {
    provider: "google",
    providerLabel: "Google DeepMind",
    modelName: "models/gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro",
    badge: "Suy luận chuyên sâu",
    contextWindow: "2,000,000 tokens",
    latency: "Tiêu chuẩn (~1.5s)",
    capabilities: "Phân tích chuyên sâu, RAG, ReAct Tool Calling",
    description: "Phân tích tài liệu kỹ thuật phức tạp, suy luận đa bước và độ chính xác ngữ nghĩa vượt trội.",
  },
  {
    provider: "openai",
    providerLabel: "OpenAI",
    modelName: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    badge: "Phản hồi nhanh",
    contextWindow: "128,000 tokens",
    latency: "Nhanh (~0.8s)",
    capabilities: "Hội thoại CSKH, RAG, Tóm tắt văn bản",
    description: "Mô hình gọn nhẹ của OpenAI, phản hồi mượt mà cho các tác vụ chăm sóc khách hàng đa ngôn ngữ.",
  },
  {
    provider: "openai",
    providerLabel: "OpenAI",
    modelName: "gpt-4o",
    displayName: "GPT-4o Flagship",
    badge: "Đa năng cao cấp",
    contextWindow: "128,000 tokens",
    latency: "Tiêu chuẩn (~1.4s)",
    capabilities: "Suy luận cao cấp, RAG, Tuân thủ chỉ thị",
    description: "Mô hình flagship của OpenAI với khả năng tổng hợp thông tin và tuân thủ chỉ thị xuất sắc.",
  },
  {
    provider: "anthropic",
    providerLabel: "Anthropic",
    modelName: "claude-3-5-sonnet-latest",
    displayName: "Claude 3.5 Sonnet",
    badge: "Văn phong tự nhiên",
    contextWindow: "200,000 tokens",
    latency: "Tiêu chuẩn (~1.3s)",
    capabilities: "Tư vấn tự nhiên, RAG, Phân tích nghiệp vụ",
    description: "Nổi bật với văn phong tư vấn tự nhiên, lịch sự và bám sát tuyệt đối ngữ cảnh tài liệu.",
  },
  {
    provider: "deepseek",
    providerLabel: "DeepSeek AI",
    modelName: "deepseek-chat",
    displayName: "DeepSeek V3",
    badge: "Hiệu năng cao",
    contextWindow: "64,000 tokens",
    latency: "Nhanh (~1.0s)",
    capabilities: "Hỏi đáp kỹ thuật, RAG, Logic & Số liệu",
    description: "Mô hình ngôn ngữ lớn thế hệ mới tối ưu cho bài toán phân tích dữ liệu và hỏi đáp nghiệp vụ.",
  },
];

const PROMPT_TEMPLATES = [
  {
    label: "Tư vấn & Bán hàng",
    prompt:
      "Bạn là chuyên viên tư vấn dịch vụ và bán hàng chuyên nghiệp. Hãy trả lời khách hàng với thái độ thân thiện, nhiệt tình, trích dẫn chính xác bảng giá và ưu đãi từ tài liệu nội bộ.",
  },
  {
    label: "Hỗ trợ Kỹ thuật & CSKH",
    prompt:
      "Bạn là kỹ sư hỗ trợ kỹ thuật và chăm sóc khách hàng. Hãy hướng dẫn từng bước rõ ràng, súc tích dựa trên tài liệu hướng dẫn và hỗ trợ kiểm tra trạng thái đơn hàng/bảo hành khi khách yêu cầu.",
  },
  {
    label: "Trợ lý Nghiệp vụ Nội bộ",
    prompt:
      "Bạn là trợ lý tra cứu quy trình và chính sách nội bộ. Chỉ cung cấp thông tin xác thực từ kho tri thức của công ty, trình bày dạng gạch đầu dòng dễ theo dõi.",
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

  // Playground Test Chat states (Right Column)
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState("");
  const [testingChat, setTestingChat] = useState(false);

  const agentCacheRef = useRef({});
  const { showToast } = useToast();

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedModelMeta =
    MANAGED_MODELS.find((m) => m.modelName === modelName) || MANAGED_MODELS[0];

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
    setTestMessages([]);

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

  const handleModelDropdownChange = (e) => {
    const chosenModelName = e.target.value;
    const found = MANAGED_MODELS.find((m) => m.modelName === chosenModelName);
    if (found) {
      setModelName(found.modelName);
      setLlmProvider(found.provider);
    } else {
      setModelName(chosenModelName);
    }
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

  const handleSendTestMessage = async (e) => {
    if (e) e.preventDefault();
    const q = testInput.trim();
    if (!q || testingChat) return;

    if (!agentId) {
      showToast("Vui lòng bấm 'Lưu Cấu Hình Trợ Lý AI' trước khi chat thử nghiệm.", "error");
      return;
    }

    setTestMessages((prev) => [...prev, { role: "user", content: q }]);
    setTestInput("");
    setTestingChat(true);

    try {
      const res = await apiRequest(`/api/v1/agents/${agentId}/test-chat`, {
        method: "POST",
        json: { question: q },
      });
      setTestMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer || "Không có phản hồi.",
          sources: res.sources || [],
        },
      ]);
    } catch (err) {
      setTestMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ [Lỗi]: ${err.message || "Không thể kết nối tới mô hình AI."}`,
          isError: true,
        },
      ]);
    } finally {
      setTestingChat(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">Cấu Hình Mô Hình & Trợ Lý AI</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Lựa chọn mô hình ngôn ngữ lớn (LLM), tinh chỉnh chỉ đạo hệ thống (System Prompt) và kiểm thử phản hồi trực tiếp
        </p>
      </div>

      {/* Main 2-Column Layout: Left Controls (7 cols) + Right Specs & Playground (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Configuration Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Service Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
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
                  {s.name} ({s.code}) {s.is_active ? "• Đang hoạt động" : "• Tạm dừng"}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model & Prompt Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Đang tải thông số cấu hình Agent...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Model Selection Dropdown List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Chọn Mô Hình Ngôn Ngữ Lớn (LLM Model)
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      <Shield className="w-3 h-3 text-sky-600" />
                      Syragent Managed AI
                    </span>
                  </div>

                  <select
                    value={modelName}
                    onChange={handleModelDropdownChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white cursor-pointer"
                  >
                    <optgroup label="Google DeepMind">
                      {MANAGED_MODELS.filter((m) => m.provider === "google").map((m) => (
                        <option key={m.modelName} value={m.modelName}>
                          {m.displayName} — {m.badge}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="OpenAI">
                      {MANAGED_MODELS.filter((m) => m.provider === "openai").map((m) => (
                        <option key={m.modelName} value={m.modelName}>
                          {m.displayName} — {m.badge}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Anthropic">
                      {MANAGED_MODELS.filter((m) => m.provider === "anthropic").map((m) => (
                        <option key={m.modelName} value={m.modelName}>
                          {m.displayName} — {m.badge}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="DeepSeek AI">
                      {MANAGED_MODELS.filter((m) => m.provider === "deepseek").map((m) => (
                        <option key={m.modelName} value={m.modelName}>
                          {m.displayName} — {m.badge}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    {selectedModelMeta.description}
                  </p>
                </div>

                {/* System Prompt + Quick Templates */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Chỉ Đạo Hệ Thống (System Prompt / Persona)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PROMPT_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setSystemPrompt(tpl.prompt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200/80 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          + {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Bạn là chuyên viên tư vấn chuyên nghiệp đại diện cho dịch vụ của công ty. Hãy trả lời lịch sự, chính xác và bám sát tài liệu..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hướng dẫn ngữ cảnh, phong cách giao tiếp và nguyên tắc trả lời của Trợ lý AI.
                  </p>
                </div>

                {/* Temperature Slider */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-600" />
                      <span>Độ Sáng Tạo (Temperature: {temperature})</span>
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      {temperature < 0.3
                        ? "Chính xác cao (Khuyên dùng cho RAG)"
                        : temperature > 0.7
                        ? "Linh hoạt & Sáng tạo"
                        : "Cân bằng"}
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
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0.0 (Bám sát tài liệu tuyệt đối)</span>
                    <span>0.5 (Tự nhiên)</span>
                    <span>1.0 (Đa dạng hóa câu chữ)</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-1 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-slate-400">
                    Mọi thay đổi sẽ có hiệu lực ngay lập tức trên Widget của dịch vụ.
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Đang lưu..." : "Lưu Cấu Hình Trợ Lý AI"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Model Spec Card + Live Test Playground */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Selected Model Technical Specs Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{selectedModelMeta.displayName}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Nhà cung cấp: {selectedModelMeta.providerLabel}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedModelMeta.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Mã Kỹ Thuật</span>
                <span className="font-mono font-bold text-slate-700 text-[11px] mt-0.5 block truncate">
                  {selectedModelMeta.modelName.replace(/^models\//, "")}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tốc Độ Phản Hồi</span>
                <span className="font-bold text-slate-700 text-[11px] mt-0.5 block">
                  {selectedModelMeta.latency}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Bộ Nhớ Ngữ Cảnh</span>
                <span className="font-bold text-slate-700 text-[11px] mt-0.5 block">
                  {selectedModelMeta.contextWindow}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Chế Độ Vận Hành</span>
                <span className="font-bold text-emerald-600 text-[11px] mt-0.5 block">
                  Managed Cloud
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-sky-50/60 border border-sky-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Năng lực: <strong className="text-slate-700">{selectedModelMeta.capabilities}</strong>
              </span>
            </div>
          </div>

          {/* 2. Live AI Test Playground Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <div>
                  <h4 className="text-xs font-bold">Khung Chat Kiểm Thử Nhanh (Playground)</h4>
                  <p className="text-[10px] text-slate-400">
                    Test trực tiếp RAG & Model của dịch vụ "{selectedService?.name || "..."}"
                  </p>
                </div>
              </div>
              {testMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTestMessages([])}
                  className="text-[11px] text-slate-300 hover:text-white inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Xóa lịch sử thử nghiệm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Làm mới</span>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="p-4 h-72 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
              {testMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 text-slate-400">
                  <Bot className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600 text-xs">
                    Kiểm tra phản hồi của {selectedModelMeta.displayName}
                  </p>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    Lưu cấu hình bên trái và gửi câu hỏi thử nghiệm bên dưới để kiểm tra độ chính xác của kho tri thức RAG.
                  </p>
                </div>
              ) : (
                testMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        msg.role === "user"
                          ? "bg-sky-600 text-white rounded-br-xs"
                          : msg.isError
                          ? "bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-xs"
                          : "bg-white text-slate-800 border border-slate-200/90 shadow-2xs rounded-bl-xs"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                          {msg.sources.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              {src}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {testingChat && (
                <div className="text-[11px] text-slate-400 italic px-2">
                  {selectedModelMeta.displayName} đang suy luận...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendTestMessage}
              className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Nhập câu hỏi thử nghiệm cho Agent..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <button
                type="submit"
                disabled={testingChat || !testInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
