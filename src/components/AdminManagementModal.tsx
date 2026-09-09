import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, X, Mail, Users, UserX, UserCheck, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { 
  SUPER_ADMIN_EMAIL, 
  getAdminEmails, 
  fetchSharedAdminsAsync, 
  addAdminEmail, 
  removeAdminEmail, 
  getLoggedInUser,
  fetchActiveUsersDataAsync,
  blockUserAsync,
  unblockUserAsync,
  ActiveUserRecord
} from '../utils/auth';
import { Language } from '../utils/i18n';

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
  const [activeTab, setActiveTab] = useState<'ADMINS' | 'USERS'>('USERS');
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [admins, setAdmins] = useState<string[]>(() => getAdminEmails());
  const [activeUsers, setActiveUsers] = useState<ActiveUserRecord[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  const refreshAllData = async () => {
    setIsLoadingUsers(true);
    try {
      const [updatedAdmins, activeData] = await Promise.all([
        fetchSharedAdminsAsync(),
        fetchActiveUsersDataAsync()
      ]);
      setAdmins(updatedAdmins);
      setActiveUsers(activeData.users);
      setBlockedUsers(activeData.blockedUsers);
      if (onAdminChange) onAdminChange();
    } catch (err) {
      console.error('Error refreshing admin management data:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMsg(null);
      refreshAllData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUser = (getLoggedInUser() || '').toLowerCase();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await addAdminEmail(newEmail);
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setNewEmail('');
        await refreshAllData();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (targetEmail: string) => {
    if (isSubmitting) return;
    if (confirm(`តើអ្នកប្រាកដថាចង់លុបសិទ្ធិ Admin ពី ${targetEmail}?`)) {
      setIsSubmitting(true);
      try {
        const res = await removeAdminEmail(targetEmail);
        if (res.success) {
          setMsg({ type: 'success', text: res.message });
          await refreshAllData();
        } else {
          setMsg({ type: 'error', text: res.message });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRevokeUser = async (targetEmail: string) => {
    if (isSubmitting) return;
    if (confirm(`តើអ្នកប្រាកដថាចង់ដកសិទ្ធិ និងលុប Gmail ${targetEmail} ចេញពីប្រព័ន្ធ? គណនីនេះនឹងត្រូវ Log out និងមិនអាចចូលប្រើបានទៀតទេ!`)) {
      setIsSubmitting(true);
      try {
        const res = await blockUserAsync(targetEmail);
        if (res.success) {
          setMsg({ type: 'success', text: res.message });
          setActiveUsers(res.users);
          setBlockedUsers(res.blockedUsers);
        } else {
          setMsg({ type: 'error', text: res.message });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleUnblockUser = async (targetEmail: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await unblockUserAsync(targetEmail);
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setActiveUsers(res.users);
        setBlockedUsers(res.blockedUsers);
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto touch-pan-y overscroll-contain">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>គ្រប់គ្រងអ្នកប្រើប្រាស់ & Admin</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                គ្រប់គ្រងសិទ្ធិ Admin និងបញ្ជី Gmail អ្នកចូលប្រើប្រាស់ក្នុងប្រព័ន្ធ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshAllData}
              disabled={isLoadingUsers}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('USERS'); setMsg(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>អ្នកប្រើប្រាស់កំពុងចូលប្រើ ({activeUsers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('ADMINS'); setMsg(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition cursor-pointer ${
              activeTab === 'ADMINS'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>បញ្ជី Admin Gmail ({admins.length})</span>
          </button>
        </div>

        {msg && (
          <div className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            msg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: ACTIVE & AUTHORIZED LOGGED-IN USERS */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>បញ្ជី Gmail ដែលកំពុង/ធ្លាប់ចូលប្រើប្រាស់:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                អ្នកអាចលុប/ដកសិទ្ធិ Gmail សង្ស័យបាន
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {activeUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
                  មិនទាន់មានអ្នកប្រើប្រាស់ផ្សេងទៀតចូលប្រើប្រាស់នៅឡើយទេ
                </div>
              ) : (
                activeUsers.map((user) => {
                  const userEmail = String(user.email).trim().toLowerCase();
                  const isSuper = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();
                  const isCurrent = userEmail === currentUser;

                  return (
                    <div
                      key={userEmail}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                        isCurrent
                          ? 'bg-blue-950/30 border-blue-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.photoUrl || `https://unavatar.io/${userEmail}`}
                          alt={user.displayName || userEmail}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail)}&background=1e293b&color=94a3b8`;
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100 font-mono">{userEmail}</span>
                            {isSuper ? (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold">
                                SUPER ADMIN
                              </span>
                            ) : user.role === 'Admin' ? (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[9px] font-bold">
                                ADMIN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px]">
                                STAFF
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px]">
                                (អ្នក)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{user.displayName || userEmail.split('@')[0]}</span>
                            <span>•</span>
                            <span className="text-emerald-400">អនឡាញចុងក្រោយ: {new Date(user.lastActive).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      {!isSuper && !isCurrent && (
                        <button
                          onClick={() => handleRevokeUser(userEmail)}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0"
                          title="លុបសិទ្ធិ និងហាមឃាត់ Gmail នេះ"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>ដកសិទ្ធិ / លុប</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Blocked Users Section */}
            {blockedUsers.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>បញ្ជី Gmail ដែល Admin បានដកសិទ្ធិ/ហាមឃាត់ ({blockedUsers.length}):</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {blockedUsers.map((bEmail) => (
                    <div
                      key={bEmail}
                      className="flex items-center justify-between p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs"
                    >
                      <span className="text-slate-300 font-mono line-through">{bEmail}</span>
                      <button
                        onClick={() => handleUnblockUser(bEmail)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium rounded-lg transition cursor-pointer shrink-0"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>អនុញ្ញាតឡើងវិញ</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADMIN MANAGEMENT */}
        {activeTab === 'ADMINS' && (
          <div className="space-y-4">
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
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>បន្ថែម Admin</span>
                </button>
              </div>
            </form>

            {/* Admin List */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>បញ្ជី Admin ទាំងអស់ ({admins.length}):</span>
                <span className="text-[10px] text-slate-400">អ្នកកំពុងប្រើ: <strong className="text-amber-300 font-mono">{currentUser}</strong></span>
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
                        <Mail className="w-4 h-4 text-amber-400 shrink-0" />
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
                          disabled={isSubmitting}
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
          </div>
        )}

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
