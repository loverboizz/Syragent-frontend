import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, ArrowRight, CheckCircle2, Zap, Brain, Plug, Palette,
  MessageSquare, Key, ChevronDown, Play, Star, Menu, X, Shield,
  BarChart3, Clock, Globe, FileText, Bot, Database
} from "lucide-react";

/* ─── Helpers ─── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const handler = () => setY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return y;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Mock Chat Demo ─── */
const DEMO_MESSAGES = [
  { role: "user", text: "Chi phí lắp đặt điện năng lượng mặt trời bao nhiêu?" },
  { role: "assistant", text: "Hệ thống điện mặt trời áp mái cho hộ gia đình từ 5kWp có giá từ **55 – 75 triệu đồng**, đã bao gồm lắp đặt và inverter chính hãng. Thời gian hoàn vốn trung bình là **5 – 7 năm**.", sources: ["Bảng Giá Q3-2026.pdf", "Quy trình lắp đặt.docx"] },
  { role: "user", text: "Có hỗ trợ lắp ở Đà Nẵng không?" },
];

function MockChat() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (visible >= DEMO_MESSAGES.length) return;
    const delay = visible === 0 ? 800 : 1800;
    const t = setTimeout(() => {
      if (DEMO_MESSAGES[visible].role === "assistant") {
        setTyping(true);
        setTimeout(() => { setTyping(false); setVisible(v => v + 1); }, 1400);
      } else {
        setVisible(v => v + 1);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden w-full max-w-sm">
      {/* Widget header */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-sky-600 to-cyan-500 shadow-md">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">S</div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Syragent Assistant</p>
          <p className="text-cyan-100 text-[11px] mt-0.5">● Trực tuyến</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[220px] bg-slate-950/50">
        {/* Greeting */}
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
          <div className="bg-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-200 leading-relaxed max-w-[78%]">
            Xin chào! Tôi có thể giúp gì cho bạn hôm nay? 😊
          </div>
        </div>

        {DEMO_MESSAGES.slice(0, visible).map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
            )}
            <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[78%] ${msg.role === "user"
              ? "bg-sky-600 text-white rounded-tr-none"
              : "bg-slate-800 text-slate-200 rounded-tl-none"
              }`}>
              {msg.text.split("**").map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="text-cyan-300">{part}</strong> : part
              )}
              {msg.sources && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <p className="text-[10px] text-slate-400 mb-1">📚 Nguồn:</p>
                  {msg.sources.map((s, si) => (
                    <span key={si} className="inline-flex items-center gap-1 bg-slate-700/60 text-slate-300 text-[10px] px-2 py-0.5 rounded-full mr-1 mb-1">
                      <FileText className="w-2.5 h-2.5" />{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
        {["Báo giá", "Bảo hành?", "Liên hệ"].map(q => (
          <span key={q} className="text-[10px] px-2.5 py-1 rounded-full border border-sky-500/30 text-sky-400 bg-sky-500/5 cursor-default">{q}</span>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800/60 flex items-center gap-2">
        <div className="flex-1 bg-slate-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-500">Nhập câu hỏi...</div>
        <button className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shrink-0">
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Feature Card ─── */
const FEATURES = [
  { icon: Brain, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10 border-violet-500/20", title: "Cô Lập Tri Thức Đa Dịch Vụ", desc: "Mỗi dịch vụ một bộ não riêng biệt. AI không bao giờ nhầm lẫn thông tin giữa các dự án." },
  { icon: Zap, color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20", title: "Phản Hồi Siêu Tốc Thời Gian Thực", desc: "Streaming token từng từ qua SSE, tốc độ dưới 1 giây, mượt mà như gõ chữ thật." },
  { icon: Plug, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/10 border-emerald-500/20", title: "Nhúng Website Trong 30 Giây", desc: "Dán 1 dòng <script> vào bất kỳ website nào. Hỗ trợ WordPress, React, HTML thuần." },
  { icon: Palette, color: "from-pink-500 to-rose-500", bg: "bg-pink-500/10 border-pink-500/20", title: "Tùy Biến Giao Diện Hoàn Toàn", desc: "Đổi màu sắc, avatar, lời chào, câu hỏi mẫu theo nhận diện thương hiệu của bạn." },
  { icon: MessageSquare, color: "from-sky-400 to-cyan-500", bg: "bg-sky-500/10 border-sky-500/20", title: "Ghi Nhớ Ngữ Cảnh & Khách Quen", desc: "Tự động khôi phục lịch sử hội thoại khi khách quay lại, AI hiểu trọn vẹn mạch đàm thoại." },
  { icon: Shield, color: "from-indigo-400 to-blue-500", bg: "bg-indigo-500/10 border-indigo-500/20", title: "Hạ Tầng Đa Mô Hình Tập Trung", desc: "Tích hợp sẵn Gemini Flash/Pro, GPT-4o, Claude 3.5 và DeepSeek trên hạ tầng bảo mật của Syragent." },
];

function FeatureCard({ icon: Icon, color, bg, title, desc, delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`group p-6 rounded-2xl border bg-slate-900/60 backdrop-blur-sm transition-all duration-700 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl ${bg} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-white font-bold text-base mb-2 leading-snug">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Steps ─── */
const STEPS = [
  { num: "01", icon: Database, title: "Tạo Dịch Vụ & Upload Tài Liệu", desc: "Tạo Agent cho từng dịch vụ. Tải lên tài liệu PDF, Word, Excel — hệ thống tự động phân tích và vector hóa toàn bộ nội dung." },
  { num: "02", icon: Bot, title: "Cấu Hình AI & Tùy Biến Widget", desc: "Tùy chỉnh System Prompt, nhiệt độ trả lời, giao diện chat widget theo màu sắc và phong cách thương hiệu của bạn." },
  { num: "03", icon: Globe, title: "Nhúng & Kích Hoạt", desc: "Sao chép 1 dòng mã script, dán vào website là xong. Trợ lý AI bắt đầu phục vụ khách hàng 24/7 ngay lập tức." },
];

/* ─── Stats ─── */
const STATS = [
  { value: "< 1s", label: "Thời gian phản hồi" },
  { value: "∞", label: "Tài liệu có thể upload" },
  { value: "100%", label: "Cô lập dữ liệu" },
  { value: "24/7", label: "Phục vụ không nghỉ" },
];

/* ─── Main Landing Page ─── */
export function LandingPage({ onLogin, onRegister, isAuthenticated = false, onGoToDashboard }) {
  const scrollY = useScrollY();
  const [menuOpen, setMenuOpen] = useState(false);
  const [featRef, featVisible] = useInView();
  const [stepsRef, stepsVisible] = useInView(0.1);
  const [heroRef, heroVisible] = useInView(0.1);

  const navScrolled = scrollY > 40;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans antialiased">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">Syragent</span>
            <span className="hidden sm:block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 uppercase tracking-wider">Platform</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            {[["Tính năng", "features"], ["Cách hoạt động", "how"], ["Bắt đầu", "cta"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">{label}</button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl shadow-lg shadow-sky-600/25 hover:shadow-sky-500/40 transition-all cursor-pointer"
              >
                <span>Vào Bảng Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={onLogin} className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-medium cursor-pointer">
                  Đăng Nhập
                </button>
                <button onClick={onRegister} className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white rounded-xl shadow-lg shadow-sky-600/25 hover:shadow-sky-500/40 transition-all cursor-pointer">
                  Dùng Thử Miễn Phí
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-4 space-y-2">
            {[["Tính năng", "features"], ["Cách hoạt động", "how"]].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition">
                {label}
              </button>
            ))}
            <div className="pt-2 space-y-2">
              {isAuthenticated ? (
                <button onClick={onGoToDashboard} className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-xl flex items-center justify-center gap-2">
                  <span>Vào Bảng Quản Trị</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={onLogin} className="w-full py-2.5 text-sm font-medium border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition">Đăng Nhập</button>
                  <button onClick={onRegister} className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-sky-600 to-cyan-500 text-white rounded-xl">Dùng Thử Miễn Phí</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Gradient background blobs */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px] -translate-x-1/2" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,1) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className={`transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/25 text-sky-300 text-xs font-semibold mb-8">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Nền Tảng AI Agent B2B SaaS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Trợ Lý AI{" "}
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
                Chuyên Biệt
              </span>
              {" "}Cho Từng Dịch Vụ Của Bạn
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Biến tài liệu PDF, Word, Excel thành Trợ lý AI thông minh tư vấn khách hàng tự động 24/7 ngay trên website của bạn — chỉ cần 1 dòng script để nhúng.
            </p>

            {/* Check list */}
            <div className="space-y-2.5 mb-10">
              {[
                "Cô lập dữ liệu hoàn toàn theo từng dịch vụ",
                "Phản hồi streaming tức thì dưới 1 giây",
                "Ghi nhớ ngữ cảnh & lịch sử hội thoại khách",
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <button
                  onClick={onGoToDashboard}
                  className="group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-semibold rounded-2xl shadow-xl shadow-sky-600/30 hover:shadow-sky-500/50 transition-all text-sm cursor-pointer"
                >
                  Truy Cập Bảng Điều Khiển
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onRegister}
                    className="group flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-semibold rounded-2xl shadow-xl shadow-sky-600/30 hover:shadow-sky-500/50 transition-all text-sm cursor-pointer"
                  >
                    Bắt Đầu Miễn Phí
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={onLogin}
                    className="flex items-center gap-2 px-6 py-3.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium rounded-2xl transition-all text-sm cursor-pointer"
                  >
                    Đăng Nhập
                  </button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-5 mt-8 pt-8 border-t border-slate-800">
              {[
                { icon: Shield, text: "SSL & AES-256" },
                { icon: BarChart3, text: "Multi-Tenancy" },
                { icon: Clock, text: "Uptime 99.9%" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="w-3.5 h-3.5 text-slate-600" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live Demo Chat */}
          <div className={`flex justify-center lg:justify-end transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 to-cyan-500/20 rounded-3xl blur-2xl scale-110" />
              <div className="relative">
                <MockChat />
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
                <Star className="w-3 h-3" /> Live Demo
              </div>
              <div className="absolute -bottom-4 -left-4 flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
                <Play className="w-3 h-3 text-sky-400" /> Đang phản hồi thật
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button onClick={() => scrollTo("stats")} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 hover:text-slate-400 transition animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-16 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div ref={featRef} className={`text-center mb-16 transition-all duration-700 ${featVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-sky-400 mb-4 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">Tính Năng Cốt Lõi</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Mọi Thứ Bạn Cần Để Triển Khai AI Dịch Vụ</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Từ việc cô lập tri thức, phản hồi thời gian thực, đến nhúng website — Syragent xử lý tất cả để bạn chỉ tập trung vào dịch vụ của mình.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 bg-slate-900/50 border-y border-slate-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div ref={stepsRef} className={`text-center mb-16 transition-all duration-700 ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">Quy Trình Triển Khai</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Lên Sóng Trong 3 Bước Đơn Giản</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Không cần kỹ sư AI, không cần cấu hình phức tạp. Bạn có thể tự triển khai trong dưới 30 phút.</p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-sky-500/30 via-violet-500/30 to-emerald-500/30" />

            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <div key={num} className={`relative transition-all duration-700 ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`} style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="relative z-10 flex flex-col items-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-sky-600/25 mb-4 relative">
                    <Icon className="w-7 h-7 text-white" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950 border-2 border-sky-500 text-sky-400 text-[10px] font-black flex items-center justify-center">{num.replace("0", "")}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMBED CODE PREVIEW ── */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-800/60 border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs text-slate-500 font-mono">index.html</span>
          </div>
          <div className="p-6 font-mono text-sm">
            <p className="text-slate-600">{`<!-- Nhúng Syragent Chat Widget -->`}</p>
            <p className="mt-1">
              <span className="text-rose-400">&lt;script</span>
              <span className="text-amber-300"> src</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-300">"https://app.syragent.vn/widget.js"</span>
            </p>
            <p className="pl-10">
              <span className="text-amber-300">data-service</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-300">"<span className="text-sky-300">your-service-code</span>"</span>
            </p>
            <p className="pl-10">
              <span className="text-amber-300">defer</span>
              <span className="text-rose-400">&gt;&lt;/script&gt;</span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Chỉ 1 dòng. Không cần cấu hình thêm bất kỳ điều gì.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-slate-950 to-violet-900/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-sky-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 mb-6 text-xs font-semibold text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Star className="w-3.5 h-3.5" /> Bắt đầu hoàn toàn miễn phí, không cần thẻ tín dụng
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-white">
            Sẵn Sàng Triển Khai <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">Trợ Lý AI Của Bạn?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Tham gia ngay hôm nay, tạo dịch vụ đầu tiên và chứng kiến AI trả lời khách hàng của bạn trong vài phút.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-2xl shadow-sky-600/30 hover:shadow-sky-500/50 transition-all text-base cursor-pointer"
              >
                Vào Bảng Quản Trị Syragent
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={onRegister}
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-2xl shadow-sky-600/30 hover:shadow-sky-500/50 transition-all text-base cursor-pointer"
                >
                  Tạo Tài Khoản Miễn Phí
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onLogin}
                  className="flex items-center justify-center gap-2 px-8 py-4 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium rounded-2xl transition-all text-base cursor-pointer"
                >
                  Đăng Nhập Quản Trị
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-slate-400 font-semibold text-sm">Syragent Platform</span>
          </div>
          <p className="text-xs text-slate-600 text-center">© 2026 Syragent Platform. Bảo mật SSL & AES-256. Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Bảo Mật</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> SaaS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

