import React, { useState, useEffect } from 'react';
import { 
  getAllWebsites, 
  addCustomWebsite, 
  getWebsiteToken, 
  deleteWebsite, 
  syncSharedWebsites, 
  updateWebsiteLogo, 
  removeWebsiteLogo,
  getDeletedWebsitesInfo,
  restoreWebsite,
  permanentlyDeleteWebsite
} from '../data/websites';
import { extractDominantColor, getLogoAdaptiveBackgroundStyle, compressLogoImage } from '../utils/logoColor';
import { WebsiteInfo } from '../types';
import { Search, Globe, ShieldCheck, CheckCircle2, ChevronRight, Layers, Plus, Lock, X, Key, Trash2, AlertTriangle, ChevronDown, Check, Languages, Camera, Image as ImageIcon, Upload, Sparkles, RefreshCw, RotateCcw, History } from 'lucide-react';
import { loadLocalRecords } from '../utils/gasHelper';

import { Language, t } from '../utils/i18n';
import { FlagIcon } from './FlagIcon';

interface WebsiteSelectorModalProps {
  isOpen: boolean;
  selectedWebsite: string | null;
  onSelectWebsite: (websiteName: string) => void;
  onClose?: () => void;
  canClose?: boolean;
  isAdmin?: boolean;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const WebsiteSelectorModal: React.FC<WebsiteSelectorModalProps> = ({
  isOpen,
  selectedWebsite,
  onSelectWebsite,
  onClose,
  canClose = false,
  isAdmin = false,
  lang = 'km',
  onLanguageChange
}) => {
  const activeLang: Language = (lang as Language) || 'km';
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [newWebsiteLogoUrl, setNewWebsiteLogoUrl] = useState('');
  const [newWebsiteLogoColor, setNewWebsiteLogoColor] = useState('#1e3a8a');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<string | null>(null);
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());

  // Logo upload modal state
  const [logoModalWeb, setLogoModalWeb] = useState<WebsiteInfo | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoExtractedColor, setLogoExtractedColor] = useState<string>('#1e3a8a');
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);

  // Deleted websites trash modal state
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [deletedWebsitesList, setDeletedWebsitesList] = useState<WebsiteInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      syncSharedWebsites().then((updated) => setWebsites(updated));
    }
    const handleWebsitesUpdated = () => {
      setWebsites(getAllWebsites());
      setDeletedWebsitesList(getDeletedWebsitesInfo());
    };
    window.addEventListener('websitesUpdated', handleWebsitesUpdated);
    return () => window.removeEventListener('websitesUpdated', handleWebsitesUpdated);
  }, [isOpen]);

  const records = loadLocalRecords();

  if (!isOpen) return null;

  const refreshWebsiteList = () => {
    const updated = getAllWebsites();
    setWebsites(updated);
    setDeletedWebsitesList(getDeletedWebsitesInfo());
  };

  const handleRestoreWebsite = (webName: string) => {
    restoreWebsite(webName);
    refreshWebsiteList();
  };

  const handlePermanentDeleteWebsite = (webName: string) => {
    if (window.confirm(`តើអ្នកប្រាកដថាចង់លុបវេបសាយ [${webName}] នេះចោលទាំងស្រុង? មិនអាចយកមកវិញបានទៀតទេ!`)) {
      permanentlyDeleteWebsite(webName);
      refreshWebsiteList();
    }
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

  // Open logo editor modal for admin
  const handleOpenLogoModal = (e: React.MouseEvent, web: WebsiteInfo) => {
    e.stopPropagation();
    if (!isAdmin) {
      setShowAdminLockNotice(true);
      return;
    }
    setLogoModalWeb(web);
    setLogoPreviewUrl(web.logoUrl || '');
    setLogoExtractedColor(web.logoBgColor || '#1e3a8a');
  };

  // Process selected file for logo
  const handleProcessLogoFile = async (file: File) => {
    try {
      setIsProcessingLogo(true);
      const compressedDataUrl = await compressLogoImage(file);
      setLogoPreviewUrl(compressedDataUrl);
      const extractedColor = await extractDominantColor(compressedDataUrl);
      setLogoExtractedColor(extractedColor);
    } catch (err) {
      console.error('Error processing logo image file:', err);
    } finally {
      setIsProcessingLogo(false);
    }
  };

  // Save updated logo for website
  const handleSaveWebsiteLogo = () => {
    if (!logoModalWeb) return;
    if (!logoPreviewUrl) {
      removeWebsiteLogo(logoModalWeb.name);
    } else {
      updateWebsiteLogo(logoModalWeb.name, logoPreviewUrl, logoExtractedColor);
    }
    refreshWebsiteList();
    setLogoModalWeb(null);
  };

  // Remove logo for website
  const handleRemoveLogo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!logoModalWeb) return;
    removeWebsiteLogo(logoModalWeb.name);
    refreshWebsiteList();
    setLogoModalWeb(null);
  };

  // Get statistics per website from local records
  const getWebsiteStats = (websiteName: string) => {
    const webRecords = records.filter(r => r.website === websiteName);
    const count = webRecords.length;
    const totalDeposit = webRecords.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
    return { count, totalDeposit };
  };

  // Filter and sort websites based on search query and customer count (highest customer count first)
  const filteredWebsites = websites
    .filter(w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      w.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
    .sort((a, b) => {
      const countA = getWebsiteStats(a.name).count;
      const countB = getWebsiteStats(b.name).count;
      if (countB !== countA) {
        return countB - countA; // Sort by highest customer count first
      }
      return a.name.localeCompare(b.name);
    });

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      setShowAdminLockNotice(true);
      return;
    }
    setNewWebsiteInput('');
    setNewWebsiteLogoUrl('');
    setNewWebsiteLogoColor('#1e3a8a');
    setShowAddWebsiteModal(true);
  };

  const handleSaveNewWebsite = () => {
    const trimmed = newWebsiteInput.trim();
    if (!trimmed) return;
    const newWeb = addCustomWebsite(trimmed);
    if (newWebsiteLogoUrl) {
      updateWebsiteLogo(newWeb.name, newWebsiteLogoUrl, newWebsiteLogoColor);
    }
    refreshWebsiteList();
    setNewWebsiteInput('');
    setNewWebsiteLogoUrl('');
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
                  {t(activeLang, 'systemTitle')}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                  {t(activeLang, 'selectWebsite')}
                </h1>
                <p className="text-slate-200 text-sm mt-0.5">
                  {t(activeLang, 'selectWebsiteDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Language Selection Dropdown List in Website Selector */}
              {onLanguageChange && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md"
                    title={t(activeLang, 'changeLanguage')}
                  >
                    <FlagIcon code={activeLang} className="w-4 h-3 rounded-xs" />
                    <span>
                      {activeLang === 'km' ? 'ខ្មែរ' : activeLang === 'en' ? 'EN' : '中文'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isLangOpen ? 'rotate-180 text-cyan-300' : ''}`} />
                  </button>

                  {isLangOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 animate-fade-in text-left">
                        <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Languages className="w-3 h-3 text-cyan-400" />
                          <span>{t(activeLang, 'language')}</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          {[
                            { code: 'km' as Language, name: 'ភាសាខ្មែរ', label: 'Khmer' },
                            { code: 'en' as Language, name: 'English', label: 'English' },
                            { code: 'zh' as Language, name: '中文', label: 'Chinese' },
                          ].map((l) => (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => {
                                onLanguageChange(l.code);
                                setIsLangOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeLang === l.code ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FlagIcon code={l.code} className="w-4 h-3 rounded-xs" />
                                <div className="text-left">
                                  <div className="leading-tight">{l.name}</div>
                                  <div className="text-[10px] opacity-70 font-mono">{l.label}</div>
                                </div>
                              </div>
                              {activeLang === l.code && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title={`${t(activeLang, 'addNewWebsite')} (${t(activeLang, 'adminOnly')})`}
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>+ {t(activeLang, 'addNewWebsite')}</span>
              </button>

              {/* Trash / History of Deleted Websites (Admin Only) */}
              <button
                type="button"
                onClick={() => {
                  if (!isAdmin) {
                    setShowAdminLockNotice(true);
                    return;
                  }
                  setDeletedWebsitesList(getDeletedWebsitesInfo());
                  setShowTrashModal(true);
                }}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="សម្រាម/ប្រវត្តិវេបសាយដែលបានលុប (Restore/Trash)"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>សម្រាមវេបសាយ ({getDeletedWebsitesInfo().length})</span>
              </button>

              {canClose && onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  {t(activeLang, 'close')}
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
              placeholder={t(activeLang, 'searchWebsitePlaceholder')}
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
              {t(activeLang, 'showingWebsites')} {filteredWebsites.length} {t(activeLang, 'ofWebsites')} {websites.length} {t(activeLang, 'websitesLabel')}
            </span>
            <span>{t(activeLang, 'clickToDashboard')}</span>
          </div>
        </div>

        {/* Website Cards Grid */}
        <div className="p-4 sm:p-6 max-h-[75vh] sm:max-h-[60vh] overflow-y-auto touch-pan-y overscroll-contain grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
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
                + {t(activeLang, 'addNewWebsite')}
              </h3>
              <p className="text-[10px] text-slate-400">
                ({t(activeLang, 'adminOnly')})
              </p>
            </div>
          </button>

          {filteredWebsites.map((web: WebsiteInfo, index: number) => {
            const isSelected = selectedWebsite === web.name;
            const stats = getWebsiteStats(web.name);
            const hasLogo = Boolean(web.logoUrl);

            return (
              <div
                key={web.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectWebsite(web.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectWebsite(web.name);
                  }
                }}
                style={hasLogo ? getLogoAdaptiveBackgroundStyle(web.logoBgColor, isSelected) : undefined}
                className={`group relative p-4 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer select-none ${
                  !hasLogo && isSelected
                    ? 'bg-gradient-to-br from-blue-900/60 to-slate-900 border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10'
                    : !hasLogo
                    ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    : 'hover:brightness-110'
                }`}
              >
                {/* Top right actions */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                  {isSelected && (
                    <span className="text-blue-400 p-0.5" title="Selected">
                      <CheckCircle2 className="w-5 h-5 fill-blue-500/20 text-blue-400" />
                    </span>
                  )}

                  {/* Admin Only: Logo upload / edit button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenLogoModal(e, web)}
                      className="p-1.5 text-slate-300 hover:text-cyan-300 bg-black/40 hover:bg-black/70 border border-white/20 rounded-lg transition cursor-pointer backdrop-blur-sm"
                      title="Admin: បន្ថែម ឬ ដូរ Logo វេបសាយ (Add/Edit Logo)"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Admin Only: Delete Website */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteWebsite(e, web.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                    title={t(activeLang, 'adminOnly')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    {hasLogo ? (
                      <div className="w-10 h-10 rounded-xl border border-white/30 bg-black/40 backdrop-blur-md p-1 shadow-md flex items-center justify-center shrink-0">
                        <img
                          src={web.logoUrl}
                          alt={`${web.displayName} Logo`}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${web.color} shadow-sm`} />
                    )}

                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                        Website #{index + 1}
                      </span>
                      {stats.count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md w-max mt-0.5">
                          {stats.count} ភ្ញៀវ
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors drop-shadow-sm">
                    {web.displayName}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="text-slate-300">
                    <span className="text-white font-bold">{stats.count}</span> {t(activeLang, 'recordsCount')}
                    {stats.totalDeposit > 0 && (
                      <span className="block text-emerald-300 font-extrabold drop-shadow-sm">
                        ${stats.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <span className={`p-1.5 rounded-lg transition ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}

          {filteredWebsites.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <p className="text-base font-medium">{searchQuery}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t(activeLang, 'autoSeparateSheets')}</span>
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
                {t(activeLang, 'adminOnly')}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t(activeLang, 'noPermissionAdmin')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminLockNotice(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              OK
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
                <span>{t(activeLang, 'addNewWebsite')}</span>
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
                {t(activeLang, 'enterWebsiteName')}
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
                placeholder="FAFA555, SBOBET99, ROYAL777"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
              />
            </div>

            {/* Optional Logo File Upload for New Website */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-300">
                បញ្ចូល Logo វេបសាយ (ជ្រើសរើសរូបភាព ឬ Upload)
              </label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 cursor-pointer transition flex items-center gap-1.5 shrink-0">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>ជ្រើសរើសរូប</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = await compressLogoImage(e.target.files[0]);
                        setNewWebsiteLogoUrl(url);
                        const color = await extractDominantColor(url);
                        setNewWebsiteLogoColor(color);
                      }
                    }}
                  />
                </label>

                {newWebsiteLogoUrl ? (
                  <div className="flex items-center gap-2 p-1.5 bg-slate-800 border border-emerald-500/40 rounded-xl flex-1 overflow-hidden">
                    <img src={newWebsiteLogoUrl} alt="New Logo" className="w-6 h-6 object-contain rounded" />
                    <span className="text-[10px] text-emerald-400 font-bold truncate">Logo Ready!</span>
                    <button
                      type="button"
                      onClick={() => setNewWebsiteLogoUrl('')}
                      className="ml-auto text-slate-400 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400">មិនទាន់ជ្រើសរើស (អាចបន្ថែមពេលក្រោយ)</span>
                )}
              </div>
            </div>

            {newWebsiteInput.trim() && (
              <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5 animate-fade-in">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security Token (Auto Generated):</span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 tracking-wider flex items-center justify-between">
                  <span>{getWebsiteToken(newWebsiteInput)}</span>
                  <span className="text-[10px] text-emerald-400 font-sans font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Auto-Token
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddWebsiteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                {t(activeLang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveNewWebsite}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                {t(activeLang, 'save')}
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
                {t(activeLang, 'confirmDelete')}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t(activeLang, 'deleteWebsiteNotice')} <span className="font-bold text-amber-400">{websiteToDelete}</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWebsiteToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                {t(activeLang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteWebsite}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t(activeLang, 'confirmDelete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Logo Management Modal */}
      {logoModalWeb && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    កែប្រែ/បញ្ចូល Logo វេបសាយ [{logoModalWeb.displayName}]
                  </h3>
                  <p className="text-xs text-slate-400">
                    Admin Only • ពណ៍ Background ដូរស្វ័យប្រវត្តិតាម Logo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLogoModalWeb(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload File or Paste Image URL */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  ជ្រើសរើសរូបភាព Logo ចេញពីឧបករណ៍ (Upload Image File)
                </label>
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-800/60 hover:bg-slate-800 rounded-2xl cursor-pointer transition text-center group">
                  <Upload className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs font-bold text-slate-200">
                    {isProcessingLogo ? 'កំពុងដំណើរការដកស្រង់ពណ៍...' : 'ចុចទីនេះដើម្បីជ្រើសរើសរូបភាព (PNG, JPG, WebP)'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    ប្រព័ន្ធនឹងកាត់ទំហំ និងទាញយកពណ៍ Background ស្វ័យប្រវត្តិ
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 my-2">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500">ឬ (OR)</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ឬ បញ្ចូល Image URL ផ្ទាល់
                </label>
                <input
                  type="text"
                  value={logoPreviewUrl}
                  onChange={async (e) => {
                    const url = e.target.value;
                    setLogoPreviewUrl(url);
                    if (url.trim()) {
                      const color = await extractDominantColor(url);
                      setLogoExtractedColor(color);
                    }
                  }}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Live Preview Card */}
              {logoPreviewUrl && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>គំរូទម្រង់ Preview កាតវេបសាយ (Live Adaptive Background)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-slate-700 text-cyan-300">
                      {logoExtractedColor}
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden shadow-xl"
                    style={getLogoAdaptiveBackgroundStyle(logoExtractedColor, true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl border border-white/30 bg-black/50 backdrop-blur-md p-1 shadow-lg flex items-center justify-center shrink-0">
                        <img
                          src={logoPreviewUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                          Auto-Adaptive Background
                        </span>
                        <h4 className="text-xl font-bold text-white mt-1">
                          {logoModalWeb.displayName}
                        </h4>
                        <p className="text-xs text-slate-200 mt-0.5">
                          Background ផ្លាស់ប្តូរស្វ័យប្រវត្តិតាមពណ៍ Logo នេះ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div>
                {logoModalWeb.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុប Logo</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogoModalWeb(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleSaveWebsiteLogo}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>រក្សាទុក Logo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trash / History of Deleted Websites Modal */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    សម្រាម/ប្រវត្តិវេបសាយដែលបានលុប (Deleted Websites Trash)
                  </h3>
                  <p className="text-xs text-slate-400">
                    អ្នកអាចស្តារ/យកវេបសាយដែលច្រលំលុបមកវិញ ឬលុបចោលទាំងស្រុង
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deletedWebsitesList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                <p className="text-sm font-semibold text-slate-300">
                  គ្មានវេបសាយដែលបានលុបនៅក្នុងសម្រាមទេ!
                </p>
                <p className="text-xs text-slate-500">
                  គ្រប់វេបសាយទាំងអស់ស្ថិតក្នុងបញ្ជីសកម្ម
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {deletedWebsitesList.map((delWeb) => (
                  <div
                    key={delWeb.name}
                    className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      {delWeb.logoUrl ? (
                        <div className="w-10 h-10 rounded-xl border border-white/20 bg-black/40 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={delWeb.logoUrl}
                            alt={delWeb.displayName}
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${delWeb.color || 'from-slate-600 to-slate-800'} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md`}>
                          {delWeb.name.substring(0, 3)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{delWeb.displayName}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                            បានលុប (Deleted)
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ID: {delWeb.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Restore Button */}
                      <button
                        type="button"
                        onClick={() => handleRestoreWebsite(delWeb.name)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                        title="យកវេបសាយនេះមកវិញ (Restore Website)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>យកមកវិញ</span>
                      </button>

                      {/* Permanent Delete Button */}
                      <button
                        type="button"
                        onClick={() => handlePermanentDeleteWebsite(delWeb.name)}
                        className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="លុបចោលទាំងស្រុង (Permanently Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>លុបផ្តាច់</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

