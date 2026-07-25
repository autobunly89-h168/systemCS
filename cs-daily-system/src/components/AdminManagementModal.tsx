import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, X, Check, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { SUPER_ADMIN_EMAIL, getAdminEmails, addAdminEmail, removeAdminEmail, getLoggedInUser } from '../utils/auth';

import { Language, t } from '../utils/i18n';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onAdminChange?: () => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  lang = 'km',
  onAdminChange
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [admins, setAdmins] = useState<string[]>(() => getAdminEmails());

  if (!isOpen) return null;

  const currentUser = getLoggedInUser() || '';

  const refreshList = () => {
    setAdmins(getAdminEmails());
    if (onAdminChange) onAdminChange();
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const res = addAdminEmail(newEmail);
    if (res.success) {
      setMsg({ type: 'success', text: res.message });
      setNewEmail('');
      refreshList();
    } else {
      setMsg({ type: 'error', text: res.message });
    }
  };

  const handleRemoveAdmin = (targetEmail: string) => {
    if (confirm(`តើអ្នកប្រាកដថាចង់លុបសិទ្ធិ Admin ពី ${targetEmail}?`)) {
      const res = removeAdminEmail(targetEmail);
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        refreshList();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>គ្រប់គ្រង Admin Gmail</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                បន្ថែម ឬ លុបសិទ្ធិ Admin សម្រាប់មើល Token, Code.gs, និង Sheet Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Admin Form */}
        <form onSubmit={handleAddAdmin} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            បន្ថែម Admin Gmail ថ្មី (Add New Admin Gmail):
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setMsg(null);
                }}
                placeholder="ឧ. staffadmin@gmail.com"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>បន្ថែម Admin</span>
            </button>
          </div>
        </form>

        {msg && (
          <div className={`p-3 rounded-xl border text-xs font-medium ${
            msg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {msg.text}
          </div>
        )}

        {/* Admin List */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>បញ្ជី Admin ទាំងអស់ ({admins.length}):</span>
            <span className="text-[10px] text-slate-400">អ្នកកំពុងប្រើ: <strong className="text-blue-300 font-mono">{currentUser}</strong></span>
          </label>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {admins.map((adm) => {
              const isSuper = adm.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
              return (
                <div
                  key={adm}
                  className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 font-mono">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-slate-200 font-semibold">{adm}</span>
                    {isSuper ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                        👑 SUPER ADMIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold">
                        🛡️ ADMIN
                      </span>
                    )}
                  </div>

                  {!isSuper && (
                    <button
                      onClick={() => handleRemoveAdmin(adm)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="លុបសិទ្ធិ Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            រួចរាល់ (Done)
          </button>
        </div>

      </div>
    </div>
  );
};
