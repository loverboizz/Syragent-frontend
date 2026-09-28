import React, { useState, useEffect } from "react";
import { Users, Plus, ShieldCheck, Mail, Calendar, UserCheck } from "lucide-react";
import { apiRequest } from "../../api/client";
import { useToast } from "../../context/ToastContext";

export function UsersTab({ onOpenCreateUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/v1/users/");
      setUsers(data || []);
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách nhân sự", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Phân Quyền Nhân Sự & Tài Khoản Phụ</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách các tài khoản Sub-Admin được phép truy cập và cấu hình dịch vụ
          </p>
        </div>

        <button
          onClick={onOpenCreateUser}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Sự Mới</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Họ & Tên</th>
                <th className="px-6 py-3.5">Email Đăng Nhập</th>
                <th className="px-6 py-3.5">Vai Trò</th>
                <th className="px-6 py-3.5">Trạng Thái</th>
                <th className="px-6 py-3.5 text-right">Ngày Tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Chưa có tài khoản phụ nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuper = u.role === "SUPER_ADMIN";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                          {(u.full_name || u.email || "U")[0].toUpperCase()}
                        </div>
                        <span>{u.full_name || "Chưa cập nhật"}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{u.email}</td>
                      <td className="px-6 py-4">
                        {isSuper ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>SUPER_ADMIN</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            <span>SUB_ADMIN</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

