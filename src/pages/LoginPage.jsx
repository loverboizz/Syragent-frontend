import React, { useState } from "react";
import { Sparkles, Shield, Lock, Mail, Building2, User, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function LoginPage({ initialRegister = false, onBack }) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!companyName.trim()) {
          showToast("Vui lòng nhập tên công ty / doanh nghiệp", "info");
          setSubmitting(false);
          return;
        }
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          company_name: companyName.trim(),
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      showToast(err.message || "Xác thực thất bại. Vui lòng kiểm tra lại thông tin.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-4xl w-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="md:w-1/2 p-8 sm:p-12 bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Syragent Platform • Nền Tảng AI Agent Dịch Vụ</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Kích Hoạt Trợ Lý AI RAG Cho Mọi Dịch Vụ Của Bạn
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
              Biến toàn bộ tài liệu Word, Excel, PDF và quy trình kỹ thuật thành Trợ lý AI tư vấn khách hàng tự động trên website theo thời gian thực.
            </p>

            <div className="mt-8 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cô lập dữ liệu tri thức theo từng dịch vụ (Multi-Tenancy)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nhúng tiện lợi chỉ với 1 dòng script HTML</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hạ tầng đa mô hình (Gemini, GPT-4o, Claude, DeepSeek) tích hợp sẵn</span>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-500 border-t border-slate-800/80 mt-8">
            © 2026 Syragent Platform. Bảo mật chứng chỉ SSL & AES-256.
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:w-1/2 p-8 sm:p-12 bg-white flex flex-col justify-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 mb-6 transition-colors w-fit cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Quay lại trang chủ</span>
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {isRegister ? "Đăng Ký Doanh Nghiệp Mới" : "Đăng Nhập Bảng Điều Khiển"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister
                ? "Khởi tạo công ty và tài khoản Super-Admin của bạn"
                : "Nhập thông tin quản trị viên để quản lý dịch vụ"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Doanh Nghiệp / Công Ty
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="VD: Công ty TNHH Giải Pháp Công Nghệ"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ & Tên Người Quản Trị
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Trần Văn Bình"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Doanh Nghiệp
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>{isRegister ? "Đăng Ký & Bắt Đầu" : "Đăng Nhập Bảng Điều Khiển"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 text-center text-xs text-slate-500">
            {isRegister ? (
              <span>
                Đã có tài khoản quản trị?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-sky-600 font-bold hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </span>
            ) : (
              <span>
                Chưa có tài khoản doanh nghiệp?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-sky-600 font-bold hover:underline"
                >
                  Đăng ký miễn phí
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

