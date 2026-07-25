import React, { useState } from 'react';
import { getAllWebsites, addCustomWebsite, getWebsiteToken, deleteWebsite } from '../data/websites';
import { WebsiteInfo } from '../types';
import { Search, Globe, ShieldCheck, CheckCircle2, ChevronRight, Layers, Plus, Lock, X, Key, Trash2, AlertTriangle } from 'lucide-react';
import { loadLocalRecords } from '../utils/gasHelper';

import { Language, t } from '../utils/i18n';

interface WebsiteSelectorModalProps {
  isOpen: boolean;
  selectedWebsite: string | null;
  onSelectWebsite: (websiteName: string) => void;
  onClose?: () => void;
  canClose?: boolean;
  isAdmin?: boolean;
  lang?: Language;
}

export const WebsiteSelectorModal: React.FC<WebsiteSelectorModalProps> = ({
  isOpen,
  selectedWebsite,
  onSelectWebsite,
  onClose,
  canClose = false,
  isAdmin = false,
  lang = 'km'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<string | null>(null);
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());

  const records = loadLocalRecords();

  if (!isOpen) return null;

  const refreshWebsiteList = () => {
    setWebsites(getAllWebsites());
  };

  const handleDeleteWebsite = (e: React.MouseEvent, webName: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      setShowAdminLockNotice(true);
      return;
    }
    setWebsiteToDelete(webName);
  };

  const confirmDeleteWebsite = () => {
    if (websiteToDelete) {
      deleteWebsite(websiteToDelete);
      const updated = getAllWebsites();
      setWebsites(updated);
      if (selectedWebsite === websiteToDelete) {
        if (updated.length > 0) {
          onSelectWebsite(updated[0].name);
        }
      }
      setWebsiteToDelete(null);
    }
  };

  // Filter websites based on search query
  const filteredWebsites = websites.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    w.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Get statistics per website from local records
  const getWebsiteStats = (websiteName: string) => {
    const webRecords = records.filter(r => r.website === websiteName);
    const count = webRecords.length;
    const totalDeposit = webRecords.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
    return { count, totalDeposit };
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      setShowAdminLockNotice(true);
      return;
    }
    setShowAddWebsiteModal(true);
  };

  const handleSaveNewWebsite = () => {
    const trimmed = newWebsiteInput.trim();
    if (!trimmed) return;
    const newWeb = addCustomWebsite(trimmed);
    refreshWebsiteList();
    setNewWebsiteInput('');
    setShowAddWebsiteModal(false);
    onSelectWebsite(newWeb.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Globe className="w-8 h-8 text-cyan-300" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                  CS DAILY MANAGEMENT SYSTEM
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                  Select Website
                </h1>
                <p className="text-slate-200 text-sm mt-0.5">
                  គ្រប់គ្រងទិន្នន័យដាច់ដោយឡែកតាមវេបសាយនីមួយៗ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="ថែម Website ថ្មី (Admin Only)"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>ថែម Website ថ្មី</span>
              </button>

              {canClose && onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  បិទ (Close)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះវេបសាយ (ឧ. FAFA191, K9WIN, SBOBET, 777...)"
              className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              បង្ហាញ {filteredWebsites.length} ក្នុងចំណោម {websites.length} វេបសាយ
            </span>
            <span>ជ្រើសរើសដើម្បីចូលកាន់ផ្ទាំង Dashboard</span>
          </div>
        </div>

        {/* Website Cards Grid */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Add Website Card Button */}
          <button
            onClick={handleOpenAddModal}
            className="group relative p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-all duration-200 flex flex-col justify-between items-center text-center cursor-pointer min-h-[120px]"
          >
            <div className="my-auto space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
                + ថែម Website ថ្មី
              </h3>
              <p className="text-[10px] text-slate-400">
                (សម្រាប់តែ Admin)
              </p>
            </div>
          </button>

          {filteredWebsites.map((web: WebsiteInfo) => {
            const isSelected = selectedWebsite === web.name;
            const stats = getWebsiteStats(web.name);

            return (
              <button
                key={web.id}
                onClick={() => onSelectWebsite(web.name)}
                className={`group relative p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-900/60 to-slate-900 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Top right actions */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                  {isSelected && (
                    <span className="text-blue-400 p-0.5" title="កំពុងជ្រើសរើស (Selected)">
                      <CheckCircle2 className="w-5 h-5 fill-blue-500/20 text-blue-400" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteWebsite(e, web.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                    title="លុប Website នេះ (Admin Only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${web.color}`} />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Website
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {web.displayName}
                  </h3>

                  {/* Security Token badge */}
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono text-[11px] text-amber-300 font-bold shadow-inner">
                    <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{getWebsiteToken(web.name)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    <span className="text-slate-200 font-medium">{stats.count}</span> ចុះឈ្មោះ
                    {stats.totalDeposit > 0 && (
                      <span className="block text-emerald-400 font-semibold">
                        ${stats.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <span className={`p-1.5 rounded-lg transition ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}

          {filteredWebsites.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p className="text-base font-medium">មិនមានវេបសាយឈ្មោះ "{searchQuery}" ទេ</p>
              <p className="text-xs mt-1">សូមត្រួតពិនិត្យពាក្យស្វែងរកម្ដងទៀត ឬប្រើប៊ូតុង "+ ថែម Website ថ្មី" ខាងលើ</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ប្រព័ន្ធបំបែក Sheet តាមវេបសាយដោយអូតូ (Auto Separate Sheets)</span>
          </div>
          <span className="text-slate-500">
            CS Daily Management System • Local & Google Sheets Sync Ready
          </span>
        </div>
      </div>

      {/* Admin Lock Permission Notice Modal */}
      {showAdminLockNotice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                សម្រាប់តែ Admin ប៉ុណ្ណោះ (Admin Permission Required)
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                លោកអ្នកមិនអាចបន្ថែម Website ថ្មីបានទេ! មុខងារនេះត្រូវបានកំណត់ឱ្យប្រើប្រាស់បានតែគណនី Admin ប៉ុណ្ណោះ។
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminLockNotice(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              យល់ព្រម (OK)
            </button>
          </div>
        </div>
      )}

      {/* Add New Website Modal */}
      {showAddWebsiteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>ថែម Website ថ្មីសម្រាប់ប្រើប្រាស់ (Add Website)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddWebsiteModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះ Website (Website Name)
              </label>
              <input
                type="text"
                autoFocus
                value={newWebsiteInput}
                onChange={(e) => setNewWebsiteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNewWebsite();
                  }
                }}
                placeholder="ឧ. FAFA555, SBOBET99, ROYAL777"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
              />
            </div>

            {newWebsiteInput.trim() && (
              <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5 animate-fade-in">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security Token ត្រូវបានបង្កើតដោយអូតូម៉ាតិក (Auto Generated):</span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 tracking-wider flex items-center justify-between">
                  <span>{getWebsiteToken(newWebsiteInput)}</span>
                  <span className="text-[10px] text-emerald-400 font-sans font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Auto-Token
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  ✓ Token នេះភ្ជាប់ជាមួយ Google Sheet ស្វ័យប្រវត្តិសម្រាប់បញ្ជូនទិន្នន័យ
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWebsiteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleSaveNewWebsite}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                រក្សាទុក (Save Website)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {websiteToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                បញ្ជាក់ការលុប (Delete Website)
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                តើអ្នកពិតជាចង់លុបវេបសាយ <span className="font-bold text-amber-400">{websiteToDelete}</span> នេះចេញពីប្រព័ន្ធមែនទេ?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWebsiteToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteWebsite}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>លុបចេញ (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

