import React, { useState, useEffect, useRef } from "react";
import {
  MessagesSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  Bot,
  User,
  ExternalLink,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Check,
} from "lucide-react";
import { apiRequest } from "../../api/client";

export function ConversationsTab({ services = [], preselectedServiceId = null }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || "");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  // Active Selected Session
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch Conversation Sessions List
  const fetchConversations = async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setLoading(true);

    try {
      let endpoint = "/api/v1/conversations/?limit=100";
      if (selectedServiceId) {
        endpoint += `&service_id=${selectedServiceId}`;
      }
      if (selectedStatus) {
        endpoint += `&status=${selectedStatus}`;
      }
      if (searchQuery.trim()) {
        endpoint += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }

      const data = await apiRequest(endpoint);
      setConversations(data || []);

      // Auto-select first conversation if none is selected or current selection is gone
      if (data && data.length > 0) {
        const currentStillExists = data.some((c) => c.id === selectedSessionId);
        if (!selectedSessionId || !currentStillExists) {
          setSelectedSessionId(data[0].id);
        }
      } else {
        setSelectedSessionId(null);
        setSessionDetail(null);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Detail for Active Session
  const fetchSessionDetail = async (sessionId) => {
    if (!sessionId) {
      setSessionDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const data = await apiRequest(`/api/v1/conversations/${sessionId}`);
      setSessionDetail(data);
    } catch (err) {
      console.error("Failed to fetch session transcript:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Re-fetch on filter changes
  useEffect(() => {
    fetchConversations(false);
  }, [selectedServiceId, selectedStatus]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load detail whenever active session changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetail(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (sessionDetail?.messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionDetail?.messages]);

  // Update Status handler
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedSessionId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiRequest(`/api/v1/conversations/${selectedSessionId}`, {
        method: "PATCH",
        json: { status: newStatus },
      });

      // Update in detail
      setSessionDetail((prev) => (prev ? { ...prev, status: newStatus } : prev));

      // Update in master list
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedSessionId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert("Không thể cập nhật trạng thái cuộc trò chuyện: " + (err.message || err));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Conversation handler
  const handleDeleteConversation = async () => {
    if (!selectedSessionId || isDeleting) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/api/v1/conversations/${selectedSessionId}`, {
        method: "DELETE",
      });

      setShowDeleteConfirm(false);
      const remaining = conversations.filter((c) => c.id !== selectedSessionId);
      setConversations(remaining);
      setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err) {
      alert("Không thể xóa cuộc trò chuyện: " + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers
  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang chat
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Đã xong
          </span>
        );
      case "needs_support":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Cần hỗ trợ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4">
      {/* 1. Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung, mã khách..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium"
            >
              <option value="">Tất cả Dịch vụ</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: "", label: "Tất cả" },
              { id: "active", label: "Đang chat" },
              { id: "needs_support", label: "Cần hỗ trợ" },
              { id: "resolved", label: "Đã xong" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedStatus === st.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchConversations(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          title="Làm mới danh sách hội thoại"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-600" : ""}`} />
          <span>{isRefreshing ? "Đang tải..." : "Đồng bộ"}</span>
        </button>
      </div>

      {/* 2. Main Master-Detail View */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
        {/* Left Column: Conversation List */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hội Thoại ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                <p className="text-xs">Đang tải cuộc trò chuyện...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <MessagesSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">Chưa có cuộc trò chuyện nào</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Khách truy cập website và gửi tin nhắn qua Widget sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              conversations.map((item) => {
                const isSelected = item.id === selectedSessionId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSessionId(item.id)}
                    className={`p-3.5 cursor-pointer transition-all ${isSelected
                        ? "bg-sky-50/70 border-l-4 border-l-sky-600 shadow-xs"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300/60 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {item.visitor_id ? item.visitor_id.substring(4, 6).toUpperCase() : "KH"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {item.title || `Khách #${item.visitor_id.substring(0, 8)}`}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {item.service_name || "Dịch vụ"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatTime(item.last_active_at)}
                      </span>
                    </div>

                    {item.last_message_preview && (
                      <p className="text-[11.5px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                        {item.last_message_preview}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-400 font-medium">
                        💬 {item.message_count} tin nhắn
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Transcript */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {!selectedSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessagesSquare className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Chưa chọn cuộc trò chuyện</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Hãy bấm vào một cuộc trò chuyện từ danh sách bên trái để đọc toàn bộ câu hỏi và câu trả lời của AI.
              </p>
            </div>
          ) : loadingDetail && !sessionDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mb-2" />
              <p className="text-xs font-medium">Đang tải toàn bộ cuộc trò chuyện...</p>
            </div>
          ) : sessionDetail ? (
            <>
              {/* Detail Header */}
              <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-sm">
                    {sessionDetail.visitor_id.substring(4, 6).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-800">
                        {sessionDetail.title || `Khách #${sessionDetail.visitor_id.substring(0, 8)}`}
                      </h3>
                      {getStatusBadge(sessionDetail.status)}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>🏷️ Dịch vụ: <strong className="text-slate-600 font-semibold">{sessionDetail.service_name}</strong></span>
                      <span>•</span>
                      <span>Bắt đầu: {new Date(sessionDetail.created_at).toLocaleDateString("vi-VN")}</span>
                    </p>
                  </div>
                </div>

                {/* Status Switcher & Delete Action */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                    <button
                      onClick={() => handleUpdateStatus("active")}
                      disabled={updatingStatus}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${sessionDetail.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Đang chat
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("needs_support")}
                      disabled={updatingStatus}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${sessionDetail.status === "needs_support"
                          ? "bg-rose-50 text-rose-700"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Cần hỗ trợ
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("resolved")}
                      disabled={updatingStatus}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${sessionDetail.status === "resolved"
                          ? "bg-slate-100 text-slate-700"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      Đã xong
                    </button>
                  </div>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    title="Xóa cuộc trò chuyện này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Transcript Scroll Feed */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30">
                {sessionDetail.messages?.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">
                    Chưa có tin nhắn nào trong phiên này.
                  </p>
                ) : (
                  sessionDetail.messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const sources = msg.sources || [];

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs shadow-2xs ${isUser
                              ? "bg-sky-600 text-white"
                              : "bg-slate-800 text-sky-400 border border-slate-700"
                            }`}
                        >
                          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>

                        {/* Bubble */}
                        <div className="space-y-1.5">
                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${isUser
                                ? "bg-sky-600 text-white rounded-tr-none"
                                : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Cited Sources for AI Responses */}
                            {!isUser && sources.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                                <div className="font-semibold text-slate-600 flex items-center gap-1 mb-1">
                                  <BookOpen className="w-3 h-3 text-sky-600" />
                                  <span>Tài liệu trích dẫn:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {sources.map((srcItem, idx) => {
                                    const srcName = typeof srcItem === "string" ? srcItem : srcItem.source;
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px]"
                                      >
                                        📄 {srcName || "Tài liệu nội bộ"}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div
                            className={`text-[10px] text-slate-400 px-1 ${isUser ? "text-right" : "text-left"
                              }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Xóa cuộc trò chuyện?</h4>
                <p className="text-xs text-slate-500">Hành động này sẽ xóa vĩnh viễn toàn bộ tin nhắn.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Bạn có chắc chắn muốn xóa cuộc trò chuyện của <strong>{sessionDetail?.title || "khách hàng này"}</strong> không?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
