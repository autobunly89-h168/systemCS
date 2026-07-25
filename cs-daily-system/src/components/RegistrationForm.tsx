import React, { useState, useEffect, useRef } from 'react';
import { PLATFORM_OPTIONS, BANK_OPTIONS, CS_ID_LIST, getWebsiteToken, getAllWebsites, addCustomWebsite } from '../data/websites';
import { PlatformType, RegistrationFormData, ShiftType, WebsiteInfo } from '../types';
import { isAdminUser } from '../utils/auth';
import {
  getCurrentShift,
  formatDateYYYYMMDD,
  checkDuplicateTodayLocal,
  submitNewRegistrationLocal,
  getSavedWebAppUrl,
  syncToGoogleSheetApi,
  loadLocalRecords,
  determineCustomerStatus
} from '../utils/gasHelper';
import { Language, t } from '../utils/i18n';
import { UserPlus, DollarSign, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Key, CreditCard, Building2, UserCheck, Lock, History, Clipboard, X, ChevronDown, Plus, Globe } from 'lucide-react';

interface RegistrationFormProps {
  currentWebsite: string;
  activeCsId: string;
  lang?: Language;
  onSuccessSubmit: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  currentWebsite,
  activeCsId,
  lang = 'km',
  onSuccessSubmit
}) => {
  const [isDepositOnly, setIsDepositOnly] = useState<boolean>(false);
  
  // Website selection in form
  const [formWebsite, setFormWebsite] = useState<string>(currentWebsite);
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);

  useEffect(() => {
    setFormWebsite(currentWebsite);
  }, [currentWebsite]);
  
  // Form State
  const [profileName, setProfileName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('Telegram Bot');
  const [sourceName, setSourceName] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [depositAmount, setDepositAmount] = useState<string>('0.00');
  const [depositDate, setDepositDate] = useState(formatDateYYYYMMDD(new Date()));
  const [bankName, setBankName] = useState('ABA Bank');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [csId, setCsId] = useState(activeCsId === 'ALL' ? 'CS-01' : activeCsId);

  // Custom Options Stored in LocalStorage
  const [customPlatforms, setCustomPlatforms] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('cs_custom_platforms');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [showAddPlatformModal, setShowAddPlatformModal] = useState(false);
  const [newPlatformInput, setNewPlatformInput] = useState('');

  const handleAddPlatform = () => {
    const trimmed = newPlatformInput.trim();
    if (!trimmed) return;
    if (!customPlatforms.includes(trimmed) && !PLATFORM_OPTIONS.includes(trimmed)) {
      const updated = [...customPlatforms, trimmed];
      setCustomPlatforms(updated);
      localStorage.setItem('cs_custom_platforms', JSON.stringify(updated));
    }
    setPlatform(trimmed);
    setNewPlatformInput('');
    setShowAddPlatformModal(false);
  };

  const [customBanks, setCustomBanks] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('cs_custom_banks');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankInput, setNewBankInput] = useState('');

  const handleAddBank = () => {
    const trimmed = newBankInput.trim();
    if (!trimmed) return;
    if (!customBanks.includes(trimmed) && !BANK_OPTIONS.includes(trimmed)) {
      const updated = [...customBanks, trimmed];
      setCustomBanks(updated);
      localStorage.setItem('cs_custom_banks', JSON.stringify(updated));
    }
    setBankName(trimmed);
    setNewBankInput('');
    setShowAddBankModal(false);
  };

  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceInput, setNewSourceInput] = useState('');

  const handleAddSource = () => {
    const trimmed = newSourceInput.trim();
    if (!trimmed) return;
    addToPasteHistory(trimmed);
    setSourceName(trimmed);
    setNewSourceInput('');
    setShowAddSourceModal(false);
  };

  // Source Name Paste History (Max 5 items)
  const [pasteHistory, setPasteHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('cs_source_name_paste_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
      }
    } catch {}
    return ['weblivechat', 'FB Ads', 'Telegram', 'TikTok', 'Google'];
  });

  const addToPasteHistory = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === 'N/A') return;

    setPasteHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('cs_source_name_paste_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removePasteHistoryItem = (itemToRemove: string) => {
    setPasteHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      localStorage.setItem('cs_source_name_paste_history', JSON.stringify(updated));
      return updated;
    });
  };

  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasteSource = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      addToPasteHistory(pastedText);
      setIsSourceDropdownOpen(true);
    }
  };

  // Status & Feedback
  const [duplicateWarning, setDuplicateWarning] = useState<{ isDuplicate: boolean; matchType?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentShift = getCurrentShift();

  // Sync CS ID from prop
  useEffect(() => {
    if (activeCsId && activeCsId !== 'ALL') {
      setCsId(activeCsId);
    }
  }, [activeCsId]);

  // Real-time Duplicate Check
  useEffect(() => {
    if (!isDepositOnly && (profileName.trim().length >= 3 || customerId.trim().length >= 3)) {
      const result = checkDuplicateTodayLocal(profileName, customerId, currentWebsite);
      if (result.isDuplicate) {
        setDuplicateWarning({ isDuplicate: true, matchType: result.matchType });
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [profileName, customerId, currentWebsite, isDepositOnly]);

  // Auto Generate Password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = 'Pass';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleOpenAddWebsiteModal = () => {
    if (!isAdminUser()) {
      setShowAdminLockNotice(true);
      return;
    }
    setShowAddWebsiteModal(true);
  };

  const handleSaveWebsiteModal = () => {
    const trimmed = newWebsiteInput.trim();
    if (!trimmed) return;
    const newWeb = addCustomWebsite(trimmed);
    const updated = getAllWebsites();
    setWebsites(updated);
    setFormWebsite(newWeb.name);
    setNewWebsiteInput('');
    setShowAddWebsiteModal(false);
  };

  const handleSubmit = (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const formData: RegistrationFormData = {
        profileName: profileName.trim() || 'N/A',
        customerId: customerId.trim() || 'N/A',
        password: password.trim() || 'N/A',
        platform,
        sourceName: sourceName.trim() || 'N/A',
        status: determineCustomerStatus(customerId, isDepositOnly),
        contactLink: contactLink.trim() || 'N/A',
        depositAmount: parseFloat(depositAmount) || 0,
        depositDate,
        bankName,
        bankAccountName: bankAccountName.trim() || 'N/A',
        bankAccountNumber: bankAccountNumber.trim() || 'N/A',
        csId: csId.trim() || 'ALL',
        isDepositOnly
      };

      if (sourceName.trim()) {
        addToPasteHistory(sourceName.trim());
      }

      const record = submitNewRegistrationLocal(formData, formWebsite);

      // Auto-sync to Google Sheet if Web App URL is configured
      const webAppUrl = getSavedWebAppUrl();
      if (webAppUrl) {
        const token = getWebsiteToken(formWebsite);
        const allRecords = loadLocalRecords();
        syncToGoogleSheetApi(formWebsite, token, allRecords, webAppUrl);
      }

      setSuccessMessage(`បានរក្សាទុកដោយជោគជ័យ! Serial No: ${record.serialNo} (${formWebsite})`);
      
      // Reset non-persistent fields
      setProfileName('');
      setCustomerId('');
      setPassword('');
      setSourceName('');
      setContactLink('');
      setBankAccountName('');
      setBankAccountNumber('');
      setDepositAmount('0.00');
      setDuplicateWarning(null);

      onSuccessSubmit();

      // Clear success alert after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);

    } catch (err) {
      console.error(err);
      alert('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                {currentWebsite}
              </span>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                {currentShift}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {isDepositOnly ? 'ទម្រង់បន្ថែមទឹកប្រាក់ (Deposit ថែម)' : 'ទម្រង់ចុះឈ្មោះអតិថិជនថ្មី (New Register)'}
            </h2>
            <p className="text-xs text-slate-400">
              រក្សាទុកទិន្នន័យដោយស្វ័យប្រវត្តិទៅកាន់ Sheet: {currentWebsite} - Register daily
            </p>
          </div>
        </div>

        {/* Mode Switch Buttons */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setIsDepositOnly(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              !isDepositOnly ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ចុះឈ្មោះថ្មី
          </button>
          <button
            type="button"
            onClick={() => setIsDepositOnly(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              isDepositOnly ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Deposit ថែម
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-xl flex items-center justify-between gap-3 shadow-lg animate-bounce-short">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:underline"
          >
            បិទ
          </button>
        </div>
      )}

      {/* Duplicate Warning Banner */}
      {duplicateWarning?.isDuplicate && (
        <div className="p-4 bg-amber-950/90 border border-amber-500/50 rounded-xl text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                រកឃើញអតិថិជនស្ទួនថ្ងៃនេះ! ({duplicateWarning.matchType})
              </h4>
              <p className="text-xs text-amber-200/80">
                អតិថិជននេះបានចុះឈ្មោះក្នុងប្រព័ន្ធសម្រាប់វេបសាយ {currentWebsite} រួចរាល់ហើយនៅថ្ងៃនេះ។
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDepositOnly(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition whitespace-nowrap"
          >
            ប្តូរទៅជា Deposit ថែម
          </button>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        
        {/* Section 1: Customer Identity */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>ព័ត៌មានអត្តសញ្ញាណអតិថិជន (Customer Info)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Profile Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះប្រូហ្វាល (Profile Name)
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="ឧ. Sokha Winner 99 (អាចទុកទទេបាន)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                អាយឌីអតិថិជន (Customer ID)
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder={`ឧ. ${currentWebsite}-1234 (អាចទុកទទេបាន)`}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ពាក្យសម្ងាត់ (Password)
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  បង្កើត Auto
                </button>
              </div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ឧ. Pass8899"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Platform */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ប្រព័ន្ធ (Platform)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddPlatformModal(true)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="ថែម Platform ថ្មីសម្រាបប្រើពេលក្រោយ"
                >
                  <Plus className="w-3 h-3 text-blue-400" />
                  <span>ថែម</span>
                </button>
              </div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from(new Set([...PLATFORM_OPTIONS, ...customPlatforms])).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Source Name */}
            <div className="relative" ref={sourceDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ប្រភពមកពី (Source Name) <span className="text-slate-500 font-normal">(អាចទុកទទេបាន)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSourceModal(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
                    title="ថែម Source ថ្មីសម្រាបប្រើពេលក្រោយ"
                  >
                    <Plus className="w-3 h-3 text-blue-400" />
                    <span>ថែម</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={sourceName}
                  onFocus={() => setIsSourceDropdownOpen(true)}
                  onPaste={handlePasteSource}
                  onChange={(e) => {
                    setSourceName(e.target.value);
                    setIsSourceDropdownOpen(true);
                  }}
                  placeholder="បញ្ចូលប្រភពដោយដៃ... (ឧ. weblivechat, FB Ads)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {pasteHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                    title="បង្ហាញប្រវត្តិ Paste History"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSourceDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                  </button>
                )}
              </div>

              {/* Floating Dropdown Overlay (Max 5 items) */}
              {isSourceDropdownOpen && pasteHistory.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-fade-in">
                  <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1 text-blue-400 font-bold">
                      <History className="w-3.5 h-3.5" />
                      ប្រវត្តិ Paste (Max 5)
                    </span>
                    <span className="text-[10px] text-slate-500">ចុចដើម្បីជ្រើសរើស</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                    {pasteHistory.map((item) => (
                      <div
                        key={item}
                        className="group flex items-center justify-between px-3.5 py-2.5 hover:bg-blue-600/20 text-slate-200 hover:text-white transition cursor-pointer"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSourceName(item);
                            setIsSourceDropdownOpen(false);
                          }}
                          className="flex-1 text-left text-xs font-mono font-medium truncate py-0.5"
                        >
                          {item}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePasteHistoryItem(item);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition rounded"
                          title={`លុប "${item}" ចេញពីប្រវត្តិ`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TG / FB Link / Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                តំណភ្ជាប់ / លេខទូរស័ព្ទ (Link / Phone)
              </label>
              <input
                type="text"
                value={contactLink}
                onChange={(e) => setContactLink(e.target.value)}
                placeholder="ឧ. t.me/username ឬ 012 345 678"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Deposit & Bank Info */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>ព័ត៌មានប្រាក់បញ្ញើ & ធនាគារ (Deposit & Bank Info)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Deposit Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ចំនួនទឹកប្រាក់ ($ Deposit Amount) <span className="text-slate-500 font-normal">(អាចទុកទទេបាន)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Deposit Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                កាលបរិច្ឆេទប្រាក់បញ្ញើ (Deposit Date)
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Bank Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ឈ្មោះធនាគារ (Bank Name)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(true)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="ថែម ធនាគារ ថ្មីសម្រាបប្រើពេលក្រោយ"
                >
                  <Plus className="w-3 h-3 text-blue-400" />
                  <span>ថែម</span>
                </button>
              </div>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from(new Set([...BANK_OPTIONS, ...customBanks])).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Bank Account Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះគណនី (Bank Account Name)
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="ឧ. SOKHA HONG"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                លេខគណនី (Bank Account Number)
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="ឧ. 000 123 456"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* CS ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>អាយឌី CS (CS ID)</span>
                <span className="text-[10px] text-blue-400 font-normal">ទាញស្វ័យប្រវត្តិពី Header</span>
              </label>
              <input
                type="text"
                list="cs-id-form-options"
                value={csId}
                onChange={(e) => setCsId(e.target.value)}
                placeholder="អាយឌី CS (ឧ. 0042)"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              <datalist id="cs-id-form-options">
                {CS_ID_LIST.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Submit Button Controls */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span>កំណត់ត្រានឹងចូលទៅកាន់: </span>
            <span className="font-mono text-blue-400 font-semibold">{currentWebsite} - Register daily</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {duplicateWarning?.isDuplicate && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
              >
                រក្សាទុកទោះបីជាស្ទួន (Force Submit)
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg ${
                isDepositOnly
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span>កំពុងរក្សាទុក...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>រក្សាទុកទិន្នន័យ (Submit)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Add Platform Modal */}
      {showAddPlatformModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>ថែមប្រព័ន្ធថ្មី (Add Platform)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPlatformModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះប្រព័ន្ធ (Platform Name)
              </label>
              <input
                type="text"
                autoFocus
                value={newPlatformInput}
                onChange={(e) => setNewPlatformInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlatform();
                  }
                }}
                placeholder="ឧ. Instagram, Line, WhatsApp"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPlatformModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAddPlatform}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                រក្សាទុក (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>ថែមប្រភពថ្មី (Add Source Name)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSourceModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះប្រភព (Source Name)
              </label>
              <input
                type="text"
                autoFocus
                value={newSourceInput}
                onChange={(e) => setNewSourceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSource();
                  }
                }}
                placeholder="ឧ. FB Ads 2, Google Ads, YouTube"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSourceModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAddSource}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                រក្សាទុក (Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>ថែមធនាគារថ្មី (Add Bank Name)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBankModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ឈ្មោះធនាគារ (Bank Name)
              </label>
              <input
                type="text"
                autoFocus
                value={newBankInput}
                onChange={(e) => setNewBankInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBank();
                  }
                }}
                placeholder="ឧ. Chip Mong Bank, J Trust Royal"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBankModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAddBank}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                រក្សាទុក (Save)
              </button>
            </div>
          </div>
        </div>
      )}

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
                    handleSaveWebsiteModal();
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
                onClick={handleSaveWebsiteModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                រក្សាទុក (Save Website)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
