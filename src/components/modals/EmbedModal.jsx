import React, { useState } from "react";
import { X, Code2, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../api/client";

export function EmbedModal({ isOpen, onClose, service }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !service) return null;

  const backendUrl =
    API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const scriptTag = `<!-- AI Service Agent Embeddable Chat Widget -->\n<script src="${backendUrl}/widget.js" data-service="${service.code}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    showToast("Đã sao chép mã nhúng thành công! Dán vào trước thẻ </body> của website.", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">Mã Nhúng Chat Widget</h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Dịch vụ: <span className="font-semibold text-slate-700">{service.name}</span> ({service.code})
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

        <div className="py-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Chỉ cần sao chép đoạn mã script dưới đây và dán vào trước thẻ đóng{" "}
            <code className="text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-mono text-[11px] border border-sky-200">
              &lt;/body&gt;
            </code>{" "}
            trên website của bạn:
          </p>

          <div className="relative">
            <textarea
              readOnly
              rows={4}
              value={scriptTag}
              onClick={(e) => e.target.select()}
              className="w-full p-3.5 bg-slate-900 text-sky-300 font-mono text-xs rounded-xl outline-none border border-slate-800 select-all resize-none shadow-inner leading-relaxed"
            />
          </div>

          <button
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md ${copied
                ? "bg-emerald-600 text-white shadow-emerald-600/20"
                : "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã Sao Chép Vào Clipboard! ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao Chép Mã Nhúng</span>
              </>
            )}
          </button>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">📌 Lưu ý bảo mật tên miền:</div>
            <div>
              Website nhúng phải khớp với Whitelist URL:{" "}
              <span className="font-mono text-slate-800 font-semibold">{service.service_url}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

