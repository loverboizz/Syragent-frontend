import React, { useState, useEffect } from "react";
import {
  X,
  Wrench,
  Plus,
  Trash2,
  ShieldCheck,
  Code2,
  Sliders,
  Zap,
  Clock,
  Globe,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function ToolModal({
  isOpen,
  onClose,
  serviceId,
  editingTool,
  initialTemplate,
  onSuccess,
  onTestSample,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [actionType, setActionType] = useState("SYNC");
  const [isActive, setIsActive] = useState(true);

  // Headers state: array of { key, value }
  const [headersList, setHeadersList] = useState([]);
  const [updateHeaders, setUpdateHeaders] = useState(false);

  // Parameters Schema mode: 'visual' | 'json'
  const [schemaMode, setSchemaMode] = useState("visual");
  const [paramsList, setParamsList] = useState([
    { name: "order_id", type: "string", description: "Mã đơn hàng cần tra cứu", required: true },
  ]);
  const [rawJsonSchema, setRawJsonSchema] = useState("");
  const [jsonError, setJsonError] = useState("");

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const isEdit = Boolean(editingTool && editingTool.id);
  const isSamplePreview = Boolean(initialTemplate && !editingTool);

  // Convert visual params list -> JSON schema object
  const buildSchemaFromVisual = (list) => {
    const properties = {};
    const required = [];
    list.forEach((p) => {
      const cleanName = p.name.trim();
      if (!cleanName) return;
      properties[cleanName] = {
        type: p.type || "string",
        description: p.description.trim() || `Tham số ${cleanName}`,
      };
      if (p.required) {
        required.push(cleanName);
      }
    });
    const schema = {
      type: "object",
      properties,
    };
    if (required.length > 0) {
      schema.required = required;
    }
    return schema;
  };

  // Convert JSON schema object -> visual params list
  const parseSchemaToVisual = (schemaObj) => {
    if (!schemaObj || typeof schemaObj !== "object" || !schemaObj.properties) {
      return [];
    }
    const reqSet = new Set(Array.isArray(schemaObj.required) ? schemaObj.required : []);
    return Object.entries(schemaObj.properties).map(([k, v]) => ({
      name: k,
      type: v?.type || "string",
      description: v?.description || "",
      required: reqSet.has(k),
    }));
  };

  useEffect(() => {
    if (!isOpen) return;
    setJsonError("");

    const source = editingTool || initialTemplate;
    if (source) {
      setName(source.name || "");
      setDescription(source.description || "");
      setHttpMethod(source.http_method || "GET");
      setEndpointUrl(source.endpoint_url || "");
      setActionType(source.action_type || "SYNC");
      setIsActive(source.is_active !== undefined ? source.is_active : true);

      const schema = source.parameters_schema || { type: "object", properties: {} };
      setRawJsonSchema(JSON.stringify(schema, null, 2));
      setParamsList(parseSchemaToVisual(schema));

      if (source.headers && typeof source.headers === "object") {
        setHeadersList(
          Object.entries(source.headers).map(([key, value]) => ({ key, value }))
        );
        setUpdateHeaders(true);
      } else {
        setHeadersList([]);
        setUpdateHeaders(!Boolean(editingTool && editingTool.has_headers));
      }
    } else {
      setName("");
      setDescription("");
      setHttpMethod("GET");
      setEndpointUrl("");
      setActionType("SYNC");
      setIsActive(true);
      setHeadersList([]);
      setUpdateHeaders(true);
      const defaultList = [
        { name: "id", type: "string", description: "Mã định danh cần tra cứu", required: true },
      ];
      setParamsList(defaultList);
      setRawJsonSchema(JSON.stringify(buildSchemaFromVisual(defaultList), null, 2));
    }
  }, [editingTool, initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSwitchSchemaMode = (targetMode) => {
    if (targetMode === schemaMode) return;
    if (targetMode === "json") {
      const schemaObj = buildSchemaFromVisual(paramsList);
      setRawJsonSchema(JSON.stringify(schemaObj, null, 2));
      setJsonError("");
      setSchemaMode("json");
    } else {
      try {
        const parsed = rawJsonSchema.trim() ? JSON.parse(rawJsonSchema) : { type: "object", properties: {} };
        setParamsList(parseSchemaToVisual(parsed));
        setJsonError("");
        setSchemaMode("visual");
      } catch (e) {
        setJsonError("JSON không hợp lệ. Vui lòng sửa lỗi cú pháp trước khi chuyển sang chế độ trực quan.");
      }
    }
  };

  const handleAddParam = () => {
    setParamsList([
      ...paramsList,
      { name: "", type: "string", description: "", required: true },
    ]);
  };

  const handleRemoveParam = (index) => {
    setParamsList(paramsList.filter((_, i) => i !== index));
  };

  const handleParamChange = (index, field, val) => {
    const updated = [...paramsList];
    updated[index] = { ...updated[index], [field]: val };
    setParamsList(updated);
  };

  const handleAddHeader = () => {
    setHeadersList([...headersList, { key: "Authorization", value: "Bearer " }]);
  };

  const handleRemoveHeader = (index) => {
    setHeadersList(headersList.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index, field, val) => {
    const updated = [...headersList];
    updated[index] = { ...updated[index], [field]: val };
    setHeadersList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSamplePreview) {
      onClose();
      return;
    }
    if (!serviceId) {
      showToast("Vui lòng chọn dịch vụ trước", "error");
      return;
    }

    // Build final parameters_schema
    let finalSchema = {};
    if (schemaMode === "visual") {
      finalSchema = buildSchemaFromVisual(paramsList);
    } else {
      try {
        finalSchema = rawJsonSchema.trim() ? JSON.parse(rawJsonSchema) : { type: "object", properties: {} };
      } catch (err) {
        setJsonError("JSON Schema không đúng cú pháp JSON.");
        return;
      }
    }

    // Build headers dict
    const headersObj = {};
    headersList.forEach((h) => {
      if (h.key.trim() && h.value.trim()) {
        headersObj[h.key.trim()] = h.value.trim();
      }
    });

    const payload = {
      name: name.trim(),
      description: description.trim(),
      http_method: httpMethod,
      endpoint_url: endpointUrl.trim(),
      action_type: actionType,
      parameters_schema: finalSchema,
      is_active: isActive,
    };

    if (!isEdit || updateHeaders) {
      payload.headers = Object.keys(headersObj).length > 0 ? headersObj : null;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiRequest(`/api/v1/services/${serviceId}/tools/${editingTool.id}`, {
          method: "PUT",
          json: payload,
        });
        showToast(`Đã cập nhật công cụ "${name}" thành công!`, "success");
      } else {
        await apiRequest(`/api/v1/services/${serviceId}/tools`, {
          method: "POST",
          json: payload,
        });
        showToast(`Đã tạo công cụ "${name}" thành công!`, "success");
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || "Không thể lưu cấu hình công cụ", "error");
    } finally {
      setLoading(false);
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
                isSamplePreview
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-sky-50 border-sky-100 text-sky-600"
              }`}
            >
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800">
                  {isSamplePreview
                    ? `Xem Cấu Hình Mẫu Minh Họa: ${name}()`
                    : isEdit
                    ? `Chỉnh Sửa Công Cụ: ${editingTool.name}`
                    : "Đăng Ký Công Cụ API Mới Của Doanh Nghiệp"}
                </h4>
                {isSamplePreview && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                    Chỉ Tham Khảo • Không Gắn Vào Agent
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isSamplePreview
                  ? "Tìm hiểu cách khai báo Tên hàm, Mô tả, Endpoint URL và JSON Schema chuẩn cho Function Calling"
                  : "Cung cấp REST API thực tế của doanh nghiệp để AI Agent tự động suy luận và thực thi"}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {isSamplePreview && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chế độ Xem Cấu Hình Mẫu (Không thêm vào AI Agent của doanh nghiệp)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Đây là bản thiết kế mẫu giúp đội ngũ kỹ thuật của doanh nghiệp hiểu cách khai báo một công cụ chuẩn. Bạn có thể chuyển đổi giữa <strong>Chế độ Trực quan</strong> và <strong>JSON Schema</strong> bên dưới để xem cấu trúc, hoặc bấm <strong>"Chạy Thử Công Cụ Mẫu Này"</strong> ở góc dưới để kiểm nghiệm luồng hoạt động.
              </p>
            </div>
          )}
          {/* 1. Name & Action Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên Hàm Định Danh (Function Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                pattern="^[a-zA-Z0-9_-]+$"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: lookup_order, check_stock, create_warranty_ticket"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Chỉ viết liền không dấu, chữ thường, số hoặc dấu gạch dưới `_`.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Loại Hành Động
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="SYNC">⚡ SYNC (Tra cứu tức thời)</option>
                <option value="ASYNC_TICKET">🎫 ASYNC_TICKET (Tạo phiếu chờ duyệt)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {actionType === "SYNC"
                  ? "Phản hồi dữ liệu trực tiếp theo thời gian thực."
                  : "Trả về mã phiếu hẹn xử lý (hoàn tiền, khiếu nại)."}
              </p>
            </div>
          </div>

          {/* 2. Description for LLM */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mô Tả Cho AI Agent (Khi nào AI nên gọi hàm này?) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Sử dụng công cụ này để tra cứu trạng thái đơn hàng, người giao hàng và ngày dự kiến nhận khi khách hàng cung cấp mã đơn hàng."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          {/* 3. HTTP Method & Endpoint URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cấu Hình Endpoint API Doanh Nghiệp <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
                className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none shrink-0"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <div className="relative flex-1">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="http://127.0.0.1:8000/api/orders/{order_id} hoặc https://api.congty.vn/v1/..."
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              <span>💡 Hỗ trợ cả Public Domain và <strong>IP Private / Localhost</strong> (<code>127.0.0.1</code>, <code>192.168.x.x</code>). Dùng <code>{"{tên_biến}"}</code> để truyền tham số trên URL.</span>
            </p>
          </div>

          {/* 4. Parameters Schema Builder */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-600" />
                  <span>Định Nghĩa Tham Số Đầu Vào (Parameters Schema)</span>
                </h5>
                <p className="text-[10px] text-slate-500">
                  Khai báo các biến mà AI cần trích xuất từ câu hỏi của khách hàng
                </p>
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchSchemaMode("visual")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    schemaMode === "visual"
                      ? "bg-sky-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Trực quan
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSchemaMode("json")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    schemaMode === "json"
                      ? "bg-sky-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>JSON Schema</span>
                </button>
              </div>
            </div>

            {jsonError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            {schemaMode === "visual" ? (
              <div className="space-y-2.5">
                {paramsList.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                    Công cụ này không yêu cầu tham số đầu vào nào.
                  </div>
                ) : (
                  paramsList.map((param, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs"
                    >
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleParamChange(idx, "name", e.target.value)}
                          placeholder="Tên biến (order_id)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:border-sky-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={param.type}
                          onChange={(e) => handleParamChange(idx, "type", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 outline-none"
                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                        </select>
                      </div>
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={param.description}
                          onChange={(e) => handleParamChange(idx, "description", e.target.value)}
                          placeholder="Mô tả ý nghĩa tham số cho AI hiểu..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-sky-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => handleParamChange(idx, "required", e.target.checked)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>Bắt buộc</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                          title="Xóa tham số"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  onClick={handleAddParam}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-sky-700 border border-slate-200/90 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tham Số</span>
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  value={rawJsonSchema}
                  onChange={(e) => {
                    setRawJsonSchema(e.target.value);
                    setJsonError("");
                  }}
                  placeholder='{"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]}'
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* 5. Auth Headers (Fernet Encrypted) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Headers Xác Thực Bảo Mật (Tùy chọn)
                  </h5>
                  <p className="text-[10px] text-slate-500">
                    Mọi khóa Bearer Token / API Key đều được mã hóa đối xứng <strong>Fernet</strong> trước khi lưu DB
                  </p>
                </div>
              </div>

              {isEdit && editingTool.has_headers && !updateHeaders ? (
                <button
                  type="button"
                  onClick={() => setUpdateHeaders(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                >
                  Thay đổi Headers đã mã hóa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm Header</span>
                </button>
              )}
            </div>

            {isEdit && editingTool.has_headers && !updateHeaders ? (
              <div className="px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span>🔒 Đang giữ nguyên bộ Headers xác thực đã mã hóa an toàn trong cơ sở dữ liệu.</span>
              </div>
            ) : headersList.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Chưa cấu hình Header xác thực nào (API không yêu cầu xác thực hoặc dùng mạng nội bộ).
              </p>
            ) : (
              <div className="space-y-2">
                {headersList.map((hdr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={hdr.key}
                      onChange={(e) => handleHeaderChange(idx, "key", e.target.value)}
                      placeholder="Header Name (VD: Authorization, X-API-Key)"
                      className="w-1/3 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={hdr.value}
                      onChange={(e) => handleHeaderChange(idx, "value", e.target.value)}
                      placeholder="Giá trị (VD: Bearer eyJhbGci...)"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Active Toggle (Hidden in Sample Preview) */}
          {!isSamplePreview && (
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Kích hoạt công cụ này ngay lập tức cho AI Agent
                </span>
              </label>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            {isSamplePreview ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng Cửa Sổ Tham Khảo
                </button>
                {onTestSample && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTestSample(initialTemplate);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    ▶ Chạy Thử Công Cụ Mẫu Này
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Đang lưu..." : isEdit ? "Lưu Cập Nhật" : "Đăng Ký Công Cụ"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

