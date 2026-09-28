import React, { useState, useEffect } from "react";
import {
  Palette,
  Bot,
  Sparkles,
  MessageSquare,
  Smile,
  Image as ImageIcon,
  Save,
  Copy,
  Check,
  CheckCircle2,
  Plus,
  X,
  Send,
  Eye,
  SlidersHorizontal,
  Code2,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

const PRESET_COLORS = [
  { name: "Sky Blue", hex: "#0284c7" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Dark Slate", hex: "#0f172a" },
];

const PRESET_EMOJIS = ["🤖", "💬", "⚡", "🌟", "👨‍💼", "👩‍💼", "🛡️", "🚀"];

export function WidgetCustomizerTab({ services = [], preselectedServiceId, onConfigSaved }) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    preselectedServiceId || (services[0]?.id || "")
  );

  // Widget Appearance States
  const [agentName, setAgentName] = useState("Trợ Lý AI");
  const [avatarType, setAvatarType] = useState("emoji"); // 'emoji' | 'image'
  const [avatarValue, setAvatarValue] = useState("🤖");
  const [primaryColor, setPrimaryColor] = useState("#0284c7");
  const [subtitle, setSubtitle] = useState("Trực tuyến • Sẵn sàng hỗ trợ 24/7");
  const [greeting, setGreeting] = useState(
    "Xin chào Quý khách! 👋 Em là Trợ lý AI của dịch vụ. Quý khách cần hỗ trợ thông tin gì về quy trình, báo giá hoặc kỹ thuật của dịch vụ này ạ?"
  );
  const [position, setPosition] = useState("right"); // 'right' | 'left'
  const [starterPrompts, setStarterPrompts] = useState([
    "Báo giá dịch vụ",
    "Chính sách bảo hành",
    "Liên hệ tư vấn viên",
  ]);
  const [newPrompt, setNewPrompt] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const { showToast } = useToast();

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  // Update selectedServiceId when services load
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

  // Load widget config when service selection changes
  useEffect(() => {
    if (!selectedService) return;

    const cfg = selectedService.widget_config || {};
    setAgentName(cfg.agent_name || selectedService.name || "Trợ Lý AI");
    setAvatarType(cfg.avatar_type || "emoji");
    setAvatarValue(cfg.avatar_value || "🤖");
    setPrimaryColor(cfg.primary_color || "#0284c7");
    setSubtitle(cfg.subtitle || "Trực tuyến • Sẵn sàng hỗ trợ 24/7");
    setGreeting(
      cfg.greeting ||
      `Xin chào Quý khách! 👋 Em là Trợ lý AI của ${selectedService.name}. Quý khách cần hỗ trợ thông tin gì ạ?`
    );
    setPosition(cfg.position || "right");
    setStarterPrompts(
      cfg.starter_prompts || ["Báo giá dịch vụ", "Chính sách bảo hành", "Liên hệ tư vấn viên"]
    );
    setPreviewMessages([]);
  }, [selectedServiceId, selectedService]);

  const handleAddPrompt = () => {
    if (!newPrompt.trim()) return;
    if (starterPrompts.length >= 6) {
      showToast("Tối đa 6 câu hỏi gợi ý để widget hiển thị gọn đẹp", "error");
      return;
    }
    setStarterPrompts([...starterPrompts, newPrompt.trim()]);
    setNewPrompt("");
  };

  const handleRemovePrompt = (index) => {
    setStarterPrompts(starterPrompts.filter((_, i) => i !== index));
  };

  const handleSaveConfig = async () => {
    if (!selectedServiceId) return;

    setSaving(true);
    try {
      const widgetConfigPayload = {
        agent_name: agentName.trim() || selectedService?.name || "Trợ Lý AI",
        avatar_type: avatarType,
        avatar_value: avatarValue.trim() || "🤖",
        primary_color: primaryColor,
        subtitle: subtitle.trim() || "Trực tuyến • Sẵn sàng hỗ trợ",
        greeting: greeting.trim(),
        position: position,
        starter_prompts: starterPrompts,
      };

      await apiRequest(`/api/v1/services/${selectedServiceId}`, {
        method: "PATCH",
        json: {
          widget_config: widgetConfigPayload,
        },
      });

      showToast("Đã lưu cấu hình giao diện Widget thành công!", "success");
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      showToast(err.message || "Lỗi khi lưu cấu hình widget", "error");
    } finally {
      setSaving(false);
    }
  };

  const scriptCode = `<script src="http://localhost:8000/widget.js" data-service="${selectedService?.code || "your-service-code"
    }"></script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    showToast("Đã sao chép mã nhúng script vào clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Live preview message simulation
  const handlePreviewSend = (text) => {
    const q = (text || previewInput).trim();
    if (!q) return;

    const newMsgs = [...previewMessages, { isUser: true, text: q }];
    setPreviewMessages(newMsgs);
    setPreviewInput("");

    // Simulate AI replying
    setTimeout(() => {
      setPreviewMessages((prev) => [
        ...prev,
        {
          isUser: false,
          text: `Cảm ơn bạn đã quan tâm đến "${q}". Đây là câu trả lời thử nghiệm từ ${agentName}.`,
        },
      ]);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">Tùy Biến Giao Diện Chatbot Widget</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Cá nhân hóa màu sắc thương hiệu, hình đại diện, tên trợ lý và câu chào hiển thị trên website khách hàng
        </p>
      </div>

      {/* Main Grid: Left Controls (7 cols) + Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Controls & Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Select Service */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn Dịch Vụ Cần Tùy Biến
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.is_active ? "• Hoạt động" : "• Tạm dừng"}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Identity: Name & Avatar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bot className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-800">1. Nhận Diện Trợ Lý (Tên & Avatar)</h4>
            </div>

            {/* Agent Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên Hiển Thị Của Trợ Lý (Agent Name)
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Ví dụ: Syragent Assistant, Mai Anh - Chuyên viên tư vấn"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ảnh Đại Diện / Biểu Tượng (Avatar)
              </label>

              {/* Type Switcher: Emoji vs Custom Image URL */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarType("emoji");
                    if (!PRESET_EMOJIS.includes(avatarValue)) setAvatarValue("🤖");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${avatarType === "emoji"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Bộ Emoji Chọn Nhanh</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarType("image");
                    if (PRESET_EMOJIS.includes(avatarValue)) setAvatarValue("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${avatarType === "image"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>URL Hình Ảnh / Logo Riêng</span>
                </button>
              </div>

              {avatarType === "emoji" ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatarValue(emoji)}
                      className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${avatarValue === emoji
                        ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 scale-105"
                        : "border-slate-200 hover:bg-slate-50"
                          ? "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 scale-105"
                          : "border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {avatarValue ? (
                      <img
                        src={avatarValue}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/100x100?text=Logo";
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={avatarValue}
                    onChange={(e) => setAvatarValue(e.target.value)}
                    placeholder="https://your-domain.com/logo.png"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dòng Trạng Thái / Phụ Đề Header
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ví dụ: Trực tuyến • Sẵn sàng hỗ trợ 24/7"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Appearance: Color & Position */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-800">2. Màu Sắc Chủ Đạo & Vị Trí Hiển Thị</h4>
            </div>

            {/* Theme Color Palette */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Màu Sắc Thương Hiệu
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-3">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPrimaryColor(col.hex)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${primaryColor.toLowerCase() === col.hex.toLowerCase()
                      ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-600/20 scale-105"
                      : "border-slate-200 hover:border-slate-300"
                        ? "border-sky-600 bg-sky-50/50 ring-2 ring-sky-600/20 scale-105"
                        : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span
                      className="w-7 h-7 rounded-full shadow-xs flex items-center justify-center text-white text-[10px]"
                      style={{ backgroundColor: col.hex }}
                    >
                      {primaryColor.toLowerCase() === col.hex.toLowerCase() && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">
                      {col.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Color Picker Input */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="#0284c7"
                />
                <span className="text-[11px] text-slate-400">
                  Chọn màu bất kỳ để đồng bộ theo màu sắc website của bạn
                </span>
              </div>
            </div>

            {/* Position Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Vị Trí Bong Bóng Chat Trên Website
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setPosition("right")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${position === "right"
                    ? "border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/20"
                    : "border-slate-200 hover:bg-slate-50"
                      ? "border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">Góc Dưới Bên Phải</p>
                    <p className="text-[10px] text-slate-500">Mặc định phổ biến nhất</p>
                  </div>
                  <div className="w-3 h-3 rounded-full border border-sky-600 flex items-center justify-center">
                    {position === "right" && <div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPosition("left")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${position === "left"
                    ? "border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/20"
                    : "border-slate-200 hover:bg-slate-50"
                      ? "border-sky-600 bg-sky-50/60 ring-2 ring-sky-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">Góc Dưới Bên Trái</p>
                    <p className="text-[10px] text-slate-500">Tránh che các nút khác</p>
                  </div>
                  <div className="w-3 h-3 rounded-full border border-sky-600 flex items-center justify-center">
                    {position === "left" && <div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Greeting & Starter Prompts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-800">3. Câu Chào & Gợi Ý Câu Hỏi Nhanh</h4>
            </div>

            {/* Greeting Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Câu Chào Mở Đầu (First Greeting Message)
              </label>
              <textarea
                rows={3}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Nhập lời chào thân thiện mở đầu cuộc trò chuyện..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Lời chào xuất hiện đầu tiên khi khách mở bong bóng chat trên trang web
              </p>
            </div>

            {/* Starter Prompts */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Gợi Ý Câu Hỏi Nhanh (Starter Prompts Chips)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {starterPrompts.map((prompt, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    <span>{prompt}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrompt(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Prompt Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPrompt();
                    }
                  }}
                  placeholder="Thêm câu hỏi mẫu mới (ấn Enter)..."
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPrompt}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Save & Script Tag Box */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>Mã Nhúng Tích Hợp Vào Website</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dán 1 dòng mã này vào trước thẻ &lt;/body&gt; trên website của bạn
                </p>
              </div>

              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Đã copy!" : "Copy Mã Nhúng"}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-sky-300 overflow-x-auto border border-slate-800">
              {scriptCode}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Đang lưu cấu hình..." : "Lưu Cấu Hình Giao Diện Widget"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live Preview (Sticky) */}
        <div className="lg:col-span-5 sticky top-8">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg overflow-hidden flex flex-col">
            {/* Mockup Browser Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                <span>🔒</span>
                <span>https://mywebsite.com/{selectedService?.code || "service"}</span>
              </div>
              <div className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Live Preview
              </div>
            </div>

            {/* Mock Webpage Canvas */}
            <div className="relative h-[620px] bg-gradient-to-b from-slate-50 to-slate-100/70 p-6 flex flex-col justify-between overflow-hidden">
              {/* Fake Landing Page Hero Content */}
              <div className="space-y-3 pointer-events-none opacity-40">
                <div className="w-20 h-4 bg-slate-300 rounded-md"></div>
                <div className="w-3/4 h-7 bg-slate-300 rounded-lg"></div>
                <div className="w-full h-3 bg-slate-200 rounded"></div>
                <div className="w-5/6 h-3 bg-slate-200 rounded"></div>
                <div className="w-32 h-8 bg-slate-300 rounded-lg mt-2"></div>
              </div>

              {/* FLOATING WIDGET PREVIEW WINDOW */}
              {previewOpen && (
                <div
                  className={`absolute bottom-20 ${position === "left" ? "left-6" : "right-6"
                    } w-[340px] max-w-[calc(100%-3rem)] h-[490px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden z-20 transition-all duration-300 animate-in fade-in zoom-in-95`}
                >
                  {/* Widget Header */}
                  <div
                    className="p-3.5 text-white flex items-center justify-between shadow-xs transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden shrink-0 border border-white/30">
                        {avatarType === "image" && avatarValue ? (
                          <img src={avatarValue} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          avatarValue || "🤖"
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight truncate max-w-[170px]">{agentName}</h4>
                        <p className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="truncate max-w-[160px]">{subtitle}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Widget Body */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70 text-xs">
                    {/* Bot Greeting Bubble */}
                    <div className="bg-white p-3 rounded-2xl rounded-bl-sm border border-slate-200/80 shadow-2xs text-slate-800 space-y-2.5">
                      <p className="leading-relaxed text-[12px]">{greeting}</p>

                      {/* Starter Prompts inside Chat */}
                      {starterPrompts.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {starterPrompts.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePreviewSend(p)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:text-white transition-all text-slate-700 border border-slate-200 text-left hover:border-transparent cursor-pointer"
                              style={{
                                ":hover": { backgroundColor: primaryColor },
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = primaryColor;
                                e.target.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#f1f5f9";
                                e.target.style.color = "#334155";
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Simulated Messages */}
                    {previewMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl text-[12px] max-w-[85%] ${m.isUser
                          ? "ml-auto rounded-br-sm text-white font-medium"
                          : "mr-auto rounded-bl-sm bg-white border border-slate-200 text-slate-800"
                            ? "ml-auto rounded-br-sm text-white font-medium"
                            : "mr-auto rounded-bl-sm bg-white border border-slate-200 text-slate-800"
                          }`}
                        style={m.isUser ? { backgroundColor: primaryColor } : {}}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>

                  {/* Widget Footer Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePreviewSend();
                    }}
                    className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={previewInput}
                      onChange={(e) => setPreviewInput(e.target.value)}
                      placeholder="Nhập câu hỏi thử nghiệm..."
                      className="flex-1 px-3 py-1.5 rounded-full border border-slate-300 text-[11px] outline-none"
                    />
                    <button
                      type="submit"
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center transition-transform active:scale-95 shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* FLOATING ACTION LAUNCHER BUTTON */}
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className={`absolute bottom-5 ${position === "left" ? "left-6" : "right-6"
                  } w-13 h-13 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-30 cursor-pointer`}
                style={{ backgroundColor: primaryColor }}
                title="Bấm để đóng/mở xem trước Widget"
              >
                {previewOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

