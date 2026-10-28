import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function ToolTestModal({ isOpen, onClose, serviceId, tool }) {
  const [paramValues, setParamValues] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !tool) return;
    setTestResult(null);

    const props = tool.parameters_schema?.properties || {};
    const initial = {};
    Object.entries(props).forEach(([key, meta]) => {
      if (meta.type === "integer" || meta.type === "number") {
        initial[key] = 1;
      } else if (meta.type === "boolean") {
        initial[key] = true;
      } else {
        // Helpful sample default based on key name
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("order")) {
          initial[key] = "ORD-12345";
        } else if (lowerKey.includes("product")) {
          initial[key] = "iPhone 16";
        } else if (lowerKey.includes("reason")) {
          initial[key] = "Sản phẩm bị lỗi màn hình, yêu cầu kiểm tra đổi mới";
        } else if (lowerKey.includes("phone")) {
          initial[key] = "0901234567";
        } else {
          initial[key] = "";
        }
      }
    });
    setParamValues(initial);
  }, [tool, isOpen]);

  const getSampleChipsForKey = (key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("order")) {
      return ["ORD-12345", "ORD-67890", "ORD-99999"];
    }
    if (lowerKey.includes("product")) {
      return ["iPhone 16", "MacBook Air M3", "AirPods Pro 2", "Samsung S24"];
    }
    if (lowerKey.includes("reason")) {
      return [
        "Sản phẩm bị lỗi màn hình, yêu cầu đổi mới",
        "Yêu cầu hoàn tiền do giao hàng trễ hẹn",
      ];
    }
    if (lowerKey.includes("phone")) {
      return ["0901234567", "0912345678", "0987654321"];
    }
    return [];
  };

  if (!isOpen || !tool) return null;

  const schemaProps = tool.parameters_schema?.properties || {};
  const requiredSet = new Set(
    Array.isArray(tool.parameters_schema?.required)
      ? tool.parameters_schema.required
      : []
  );
  const paramKeys = Object.keys(schemaProps);

  const handleParamChange = (key, rawVal, type) => {
    let val = rawVal;
    if (type === "integer") {
      val = rawVal === "" ? "" : parseInt(rawVal, 10);
    } else if (type === "number") {
      val = rawVal === "" ? "" : parseFloat(rawVal);
    } else if (type === "boolean") {
      val = Boolean(rawVal);
    }
    setParamValues((prev) => ({ ...prev, [key]: val }));
  };

  const isSandboxSample = Boolean(tool.isSandboxSample || !tool.id);

  const handleRunTest = async (e) => {
    e.preventDefault();
    if (!isSandboxSample && (!serviceId || !tool?.id)) return;

    setTesting(true);
    setTestResult(null);

    try {
      const cleanedParams = {};
      Object.entries(paramValues).forEach(([k, v]) => {
        if (v !== "" && v !== undefined) {
          cleanedParams[k] = v;
        }
      });

      const res = isSandboxSample
        ? await apiRequest("/api/v1/sandbox/test-sample-tool", {
            method: "POST",
            json: {
              tool_name: tool.name,
              test_parameters: cleanedParams,
            },
          })
        : await apiRequest(
            `/api/v1/services/${serviceId}/tools/${tool.id}/test`,
            {
              method: "POST",
              json: {
                test_parameters: cleanedParams,
              },
            }
          );

      setTestResult(res);
      if (res.success) {
        showToast(
          isSandboxSample
            ? "Chạy thử công cụ mẫu thành công!"
            : "Gọi thử API thành công!",
          "success"
        );
      } else {
        showToast("API trả về lỗi hoặc không tìm thấy dữ liệu", "error");
      }
    } catch (err) {
      showToast(err.message || "Lỗi khi chạy thử công cụ", "error");
      setTestResult({
        success: false,
        status_code: null,
        response_time_ms: 0,
        error: err.message || "Không thể kết nối tới máy chủ.",
        data: null,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${
                isSandboxSample
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
              }`}
            >
              <Play className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800">
                  {isSandboxSample
                    ? "Mô Phỏng Hoạt Động Công Cụ Mẫu"
                    : "Chạy Thử Nghiệm Công Cụ (Dry-Run)"}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                  {tool.name}()
                </span>
                {isSandboxSample && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                    Sandbox Demo • Không Gắn Vào Agent
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isSandboxSample
                  ? "Giúp doanh nghiệp trải nghiệm cách AI truyền tham số, gọi API và tổng hợp câu trả lời từ JSON"
                  : "Kiểm tra trực tiếp kết nối từ Action Gateway tới API doanh nghiệp (Timeout 6.0s)"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleRunTest} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Endpoint Summary */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 font-bold font-mono text-[11px]">
              {tool.http_method}
            </span>
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <code className="text-slate-700 font-mono text-[11px] truncate" title={tool.endpoint_url}>
              {tool.endpoint_url}
            </code>
          </div>

          {/* Sample Parameters Inputs */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nhập Tham Số Mẫu Đầu Vào
            </h5>

            {paramKeys.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                Công cụ này không yêu cầu tham số đầu vào. Bạn có thể bấm chạy thử ngay.
              </div>
            ) : (
              <div className="space-y-3">
                {paramKeys.map((key) => {
                  const meta = schemaProps[key] || {};
                  const isReq = requiredSet.has(key);
                  return (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        <span className="font-mono text-sky-700">{key}</span>{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({meta.type || "string"})
                        </span>
                        {isReq && <span className="text-rose-500 ml-1">*</span>}
                      </label>
                      {meta.type === "boolean" ? (
                        <select
                          value={String(paramValues[key] ?? true)}
                          onChange={(e) =>
                            handleParamChange(key, e.target.value === "true", "boolean")
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={
                            meta.type === "integer" || meta.type === "number"
                              ? "number"
                              : "text"
                          }
                          required={isReq}
                          value={paramValues[key] ?? ""}
                          onChange={(e) =>
                            handleParamChange(key, e.target.value, meta.type)
                          }
                          placeholder={meta.description || `Nhập giá trị cho ${key}...`}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                      )}
                      {meta.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {meta.description}
                        </p>
                      )}
                      {getSampleChipsForKey(key).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] font-semibold text-slate-400">
                            Dữ liệu mẫu:
                          </span>
                          {getSampleChipsForKey(key).map((sample) => (
                            <button
                              key={sample}
                              type="button"
                              onClick={() => handleParamChange(key, sample, meta.type)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                                paramValues[key] === sample
                                  ? "bg-sky-100 text-sky-700 border-sky-300 font-bold"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                              }`}
                            >
                              {sample}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Test Button */}
          <div>
            <button
              type="submit"
              disabled={testing}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testing ? "Đang gửi request tới API..." : "Gửi Yêu Cầu Thử Nghiệm"}</span>
            </button>
          </div>

          {/* Live Output Viewer */}
          {testResult && (
            <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>THÀNH CÔNG (HTTP {testResult.status_code || 200})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        THẤT BẠI {testResult.status_code ? `(HTTP ${testResult.status_code})` : ""}
                      </span>
                    </span>
                  )}
                </div>

                {testResult.response_time_ms !== undefined && testResult.response_time_ms !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{testResult.response_time_ms} ms</span>
                  </span>
                )}
              </div>

              {testResult.error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  ⚠️ <strong>Chi tiết lỗi:</strong> {testResult.error}
                </div>
              )}

              {testResult.data?._truncated && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Dữ liệu phản hồi lớn hơn 4KB nên đã được Action Gateway tự động thu gọn để bảo vệ bộ nhớ ngữ cảnh LLM.
                  </span>
                </div>
              )}

              <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>[Bước 3 - Observation] JSON Payload API Trả Về Cho AI</span>
                  </span>
                </div>
                <pre className="p-3.5 text-xs font-mono text-emerald-300 overflow-x-auto max-h-52 custom-scrollbar">
                  {JSON.stringify(testResult.data, null, 2) || "// Không có dữ liệu trả về"}
                </pre>
              </div>

              {/* Simulated ReAct & AI Answer Explanation for Sample Tools */}
              {testResult.simulated_ai_reply && (
                <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 space-y-2.5">
                  <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center justify-between">
                    <span>🤖 [Bước 4 - Synthesis] Mô Phỏng Câu Trả Lời Của AI Cho Khách Hàng</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-[10px] text-sky-700 font-mono">
                      ReAct Loop
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-sky-100 text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-2xs">
                    {testResult.simulated_ai_reply}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    💡 <strong>Giải thích cơ chế:</strong> Khi bạn đăng ký API thật của doanh nghiệp vào danh sách bên dưới, AI sẽ tự động trích xuất tham số từ tin nhắn của khách ➔ gọi API như bước trên ➔ đọc JSON trả về và diễn đạt lại thành câu trả lời tự nhiên như ví dụ này.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

