import React, { useState, useEffect } from "react";
import { X, Sparkles, Globe, KeyRound, Check } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function ServiceModal({ isOpen, onClose, editingService, onSuccess }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [serviceUrl, setServiceUrl] = useState("http://localhost:5500");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (editingService) {
      setName(editingService.name || "");
      setCode(editingService.code || "");
      setServiceUrl(editingService.service_url || "http://localhost:5500");
      setIsActive(editingService.is_active !== undefined ? editingService.is_active : true);
    } else {
      setName("");
      setCode("");
      setServiceUrl("http://localhost:5500");
      setIsActive(true);
    }
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editingService;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // Update existing service
        await apiRequest(`/api/v1/services/${editingService.id}`, {
          method: "PATCH",
          json: {
            name: name.trim(),
            code: code.trim().toLowerCase(),
            service_url: serviceUrl.trim(),
            is_active: isActive,
          },
        });
        showToast(`Đã cập nhật dịch vụ "${name}" thành công!`, "success");
      } else {
        // Create new service
        const newService = await apiRequest("/api/v1/services/", {
          method: "POST",
          json: {
            name: name.trim(),
            code: code.trim().toLowerCase(),
            service_url: serviceUrl.trim(),
          },
        });

        // Automatically initialize default FREE Agent
        try {
          await apiRequest("/api/v1/agents/", {
            method: "POST",
            json: {
              service_id: newService.id,
              llm_provider: "google",
              ai_tier: "FREE",
              model_name: "models/gemini-3.6-flash",
            },
          });
        } catch (agentErr) {
          console.warn("Auto agent creation notice:", agentErr);
        }

        showToast(`Đã khởi tạo dịch vụ "${name}" & Trợ lý AI thành công!`, "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại. Vui lòng kiểm tra lại thông tin.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                {isEdit ? `Chỉnh Sửa Dịch Vụ` : "Thêm Dịch Vụ Mới"}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isEdit ? `Mã ID: ${editingService.id}` : "Mỗi dịch vụ sở hữu 1 Trợ lý AI và 1 mã nhúng riêng"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Dịch Vụ
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khảo Sát Drone LiDAR Zenmuse L2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã Dịch Vụ (Slug duy nhất)
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: s0257 hoặc lidar-survey"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none font-mono transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">Chỉ chứa chữ thường, số và dấu gạch nối.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Website Nhúng (Whitelist URL)
            </label>
            <input
              type="url"
              required
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
              placeholder="https://mycompany.vn hoặc http://localhost:5500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Chỉ cho phép website này gọi Chat Widget để bảo mật tài nguyên AI.
            </p>
          </div>

          {isEdit && (
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Kích hoạt hoạt động (ON)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Bật để Chat Widget trên website phục vụ khách hàng. Tắt để tạm dừng.
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <span>{isEdit ? "Lưu Cập Nhật" : "Tạo Dịch Vụ & Trợ Lý AI"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

