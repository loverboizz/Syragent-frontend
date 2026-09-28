import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function KnowledgeTab({ services = [], preselectedServiceId, onKnowledgeChanged }) {
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || (services[0]?.id || ""));
  const [agent, setAgent] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const knowledgeCacheRef = useRef({});
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

  // 2. Load Agent & Chunks for Selected Service (with Cache)
  const loadAgentAndChunks = async (forceRefresh = false) => {
    if (!selectedServiceId) return;

    if (!forceRefresh && knowledgeCacheRef.current[selectedServiceId]) {
      const cached = knowledgeCacheRef.current[selectedServiceId];
      setAgent(cached.agent);
      setChunks(cached.chunks || []);
      return;
    }

    setLoadingChunks(true);
    try {
      const srv = await apiRequest(`/api/v1/services/${selectedServiceId}`);
      let targetAgent = srv.agent;

      // Auto-create agent if missing
      if (!targetAgent) {
        targetAgent = await apiRequest("/api/v1/agents/", {
          method: "POST",
          json: {
            service_id: selectedServiceId,
            llm_provider: "google",
            ai_tier: "FREE",
            model_name: "models/gemini-3.6-flash",
          },
        });
      }

      setAgent(targetAgent);

      // Load chunks
      let docChunks = [];
      if (targetAgent?.id) {
        docChunks = await apiRequest(`/api/v1/agents/${targetAgent.id}/documents`);
        setChunks(docChunks || []);
      }

      // Save to cache
      knowledgeCacheRef.current[selectedServiceId] = {
        agent: targetAgent,
        chunks: docChunks || [],
      };
    } catch (err) {
      showToast(err.message || "Không thể tải kho tri thức", "error");
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    loadAgentAndChunks();
  }, [selectedServiceId]);

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const validExtensions = [".pdf", ".docx", ".xlsx", ".txt", ".html"];
    const filtered = newFiles.filter((f) => {
      const ext = "." + f.name.split(".").pop().toLowerCase();
      return validExtensions.includes(ext);
    });

    if (filtered.length < newFiles.length) {
      showToast("Một số file bị bỏ qua do không đúng định dạng (.docx, .xlsx, .pdf, .txt, .html)", "info");
    }

    setSelectedFiles((prev) => [...prev, ...filtered]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Batch Files
  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 file tài liệu để tải lên", "info");
      return;
    }
    if (!agent?.id) {
      showToast("Trợ lý AI chưa sẵn sàng. Vui lòng thử lại sau giây lát.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await apiRequest(`/api/v1/agents/${agent.id}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      showToast(res.message || `Đã nạp thành công ${selectedFiles.length} file vào kho tri thức!`, "success");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAgentAndChunks(true);
      if (onKnowledgeChanged) onKnowledgeChanged();
    } catch (err) {
      showToast(err.message || "Lỗi khi vector hóa tài liệu", "error");
    } finally {
      setUploading(false);
    }
  };

  // Delete Chunk
  const handleDeleteChunk = async (chunkId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đoạn tri thức này khỏi cơ sở dữ liệu vector?")) {
      return;
    }

    try {
      await apiRequest(`/api/v1/agents/${agent.id}/documents/${chunkId}`, {
        method: "DELETE",
      });
      showToast("Đã xóa đoạn tri thức thành công!", "success");
      setChunks((prev) => {
        const next = prev.filter((c) => c.id !== chunkId);
        if (knowledgeCacheRef.current[selectedServiceId]) {
          knowledgeCacheRef.current[selectedServiceId].chunks = next;
        }
        return next;
      });
      if (onKnowledgeChanged) onKnowledgeChanged();
    } catch (err) {
      showToast(err.message || "Không thể xóa đoạn tri thức", "error");
    }
  };

  const getFileBadgeIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
    if (ext === "docx" || ext === "doc") {
      return <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
    }
    if (ext === "html") {
      return <FileCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800">Kho Tri Thức & Nạp Dữ Liệu Vector (RAG)</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tải tài liệu nghiệp vụ lên để Trợ lý AI học và trích dẫn trả lời chính xác cho khách hàng
        </p>
      </div>

      {/* Select Service Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Chọn Dịch Vụ Cần Nạp Tri Thức
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

      {/* Drag & Drop Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
        <div>
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-sky-600" />
            <span>Nạp Tài Liệu Hướng Dẫn & Báo Giá</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Hỗ trợ Word (.docx), Excel (.xlsx), PDF (.pdf), Text (.txt), HTML. Có thể chọn nhiều file cùng lúc.
          </p>
        </div>

        {/* Dropzone Container */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${isDragOver
            ? "border-sky-500 bg-sky-50/60"
            : "border-slate-300 hover:border-sky-500 hover:bg-slate-50/60"
            }`}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.docx,.xlsx,.txt,.html"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">
              Kéo & thả nhiều tệp tài liệu vào đây, hoặc{" "}
              <span className="text-sky-600 hover:underline">chọn từ máy tính</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Định dạng tối ưu: .docx (bảng biểu), .xlsx (bảng giá, nhân sự), .pdf (quy trình kỹ thuật)
            </p>
          </div>
        </div>

        {/* Selected Files List Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Danh sách file chờ tải lên ({selectedFiles.length})</span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-[11px] text-slate-400 hover:text-rose-600"
              >
                Xóa tất cả
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileBadgeIcon(file.name)}
                    <span className="font-semibold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={handleUploadBatch}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {uploading
                  ? `Đang trích xuất & Vector hóa ${selectedFiles.length} tệp...`
                  : `Bắt Đầu Vector Hóa (${selectedFiles.length} Tệp)`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Vector Chunks Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-800">Dữ Liệu Đoạn Tri Thức Đã Vector Hóa</h4>
            <p className="text-xs text-slate-400">
              Tổng số {chunks.length} đoạn tri thức trong kho vector (Supabase pgvector)
            </p>
          </div>
          <button
            onClick={loadAgentAndChunks}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
          >
            Làm mới &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5 w-16">#</th>
                <th className="px-6 py-3.5">Nội Dung Đoạn Tri Thức (Content)</th>
                <th className="px-6 py-3.5 w-48">Nguồn Tài Liệu (Source)</th>
                <th className="px-6 py-3.5 w-24 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadingChunks ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Đang nạp các đoạn vector embeddings...
                  </td>
                </tr>
              ) : chunks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Kho tri thức của dịch vụ này đang trống. Hãy kéo thả file ở trên để vector hóa.
                  </td>
                </tr>
              ) : (
                chunks.map((chunk, idx) => (
                  <tr key={chunk.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-2 leading-relaxed text-slate-800" title={chunk.content}>
                        {chunk.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700 border border-slate-200/80 max-w-[180px] truncate" title={chunk.source}>
                        {getFileBadgeIcon(chunk.source || "")}
                        <span className="truncate">{chunk.source || "Tài liệu"}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteChunk(chunk.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center"
                        title="Xóa đoạn tri thức này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

