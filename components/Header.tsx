import React, { useState, useEffect } from 'react';
import { WEBSITE_LIST, CS_ID_LIST, getWebsiteToken, getAllWebsites } from '../data/websites';
import { getCurrentShift, saveManualShift } from '../utils/gasHelper';
import { Language, Theme, t } from '../utils/i18n';
import { getUserProfilePhoto } from '../utils/auth';
import { FlagIcon } from './FlagIcon';
import { Clock, User, Users, Code2, ArrowLeftRight, ShieldCheck, Sun, Moon, LayoutDashboard, UserPlus, Search, Table, FileSpreadsheet, BarChart3, Key, Copy, Check, Mail, LogOut, Lock, Languages, ChevronDown, RefreshCw, Info, Smartphone, Database, Sparkles, X } from 'lucide-react';
import csLogo from '../assets/images/cs_daily_logo_1784810370607.jpg';
import csIcon from '../assets/images/cs_daily_icon_1784810386041.jpg';
import { SheetSyncModal } from './SheetSyncModal';

interface HeaderProps {
  currentWebsite: string;
  onChangeWebsiteClick: () => void;
  activeCsId: string;
  onCsIdChange: (csId: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenGasExporter: () => void;
  loggedInUser: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onOpenLoginModal: () => void;
  onOpenAdminModal: () => void;
  onLogout?: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onShiftChange?: (shift: 'វេនព្រឹក' | 'វេនយប់') => void;
  onOpenSystemUpdate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWebsite,
  onChangeWebsiteClick,
  activeCsId,
  onCsIdChange,
  activeTab,
  onTabChange,
  onOpenGasExporter,
  loggedInUser,
  isAdmin,
  isSuperAdmin,
  onOpenLoginModal,
  onOpenAdminModal,
  onLogout,
  lang,
  onLanguageChange,
  theme,
  onThemeToggle,
  onShiftChange,
  onOpenSystemUpdate
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [currentShift, setCurrentShift] = useState<'វេនព្រឹក' | 'វេនយប់'>('វេនព្រឹក');
  const [copiedToken, setCopiedToken] = useState(false);
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const websiteToken = getWebsiteToken(currentWebsite);

  const languageOptions = [
    { code: 'km' as Language, name: 'ភាសាខ្មែរ', flag: '🇰🇭', label: 'ខ្មែរ (KM)' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸', label: 'English (EN)' },
    { code: 'zh' as Language, name: '中文', flag: '🇨🇳', label: '中文 (ZH)' },
  ];

  const currentLangObj = languageOptions.find(l => l.code === lang) || languageOptions[0];

  const handleCopyToken = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    navigator.clipboard.writeText(websiteToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentShift(getCurrentShift(now));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const allWebsites = getAllWebsites();
  const websiteObj = allWebsites.find(w => w.name.toUpperCase() === currentWebsite.toUpperCase()) || allWebsites[0] || WEBSITE_LIST[0];

  const navTabs = [
    { id: 'dashboard', label: t(lang, 'dashboard'), icon: LayoutDashboard },
    { id: 'register', label: t(lang, 'register'), icon: UserPlus },
    { id: 'search', label: t(lang, 'search'), icon: Search },
    { id: 'records_daily', label: `${t(lang, 'dataTable')} (Daily)`, icon: Table },
    { id: 'records_all', label: `${t(lang, 'dataTable')} (All)`, icon: FileSpreadsheet },
    { id: 'reports', label: t(lang, 'reports'), icon: BarChart3 },
  ];

  const isLight = theme === 'light';

  return (
    <header className={`${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'} border-b sticky top-0 z-40 shadow-md transition-colors duration-300`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`flex flex-col md:flex-row items-center justify-between py-1.5 sm:py-2 gap-2 border-b-0 md:border-b ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          
          {/* Logo & Website Badge */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className={`relative overflow-hidden p-0.5 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-700/80'} border rounded-lg shadow-sm group`}>
                <img
                  src={csIcon}
                  alt="CS DAILY SYSTEM Logo Icon"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded-md transform group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold leading-tight flex items-center gap-1.5 tracking-tight">
                  <span className={isLight ? "bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent"}>
                    {t(lang, 'systemTitle')}
                  </span>
                  <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.2 bg-blue-600/20 border border-blue-500/30 text-blue-500 dark:text-blue-300 rounded-full shadow-sm">
                    {t(lang, 'gasBadge')}
                  </span>
                </h1>
                <p className={`text-[10px] sm:text-xs font-medium leading-none ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t(lang, 'systemSubtitle')}</p>
              </div>
            </div>

            {/* Active Website Badge & Switch Button */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800/90 border-slate-700 text-white'} font-bold text-xs shadow-inner`}>
                {websiteObj.logoUrl ? (
                  <img
                    src={websiteObj.logoUrl}
                    alt={websiteObj.displayName}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain rounded bg-black/20 p-0.5 border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${websiteObj.color} animate-pulse`} />
                )}
                <span>{currentWebsite}</span>
              </div>

              <button
                onClick={onChangeWebsiteClick}
                className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-600 dark:text-blue-300 hover:text-blue-500 border border-blue-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="ប្តូរវេបសាយ (Switch Website)"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span className="hidden sm:inline">{t(lang, 'switchWebsite')}</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Compact Header Bar with all essential controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-end flex-wrap pt-1 md:pt-0">
            
            {/* Live Clock & Shift Selection */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:py-1 ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800/90 border-slate-700/90 text-slate-200'} border rounded-lg text-xs shadow-inner`}>
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-mono font-bold text-[10px] sm:text-[11px] whitespace-nowrap">{timeStr}</span>
              <select
                value={currentShift}
                onChange={(e) => {
                  const selected = e.target.value as 'វេនព្រឹក' | 'វេនយប់';
                  setCurrentShift(selected);
                  saveManualShift(selected);
                  if (onShiftChange) onShiftChange(selected);
                }}
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] cursor-pointer outline-none transition border ${
                  currentShift === 'វេនព្រឹក'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                    : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40'
                }`}
                title="ជ្រើសរើសវេនធ្វើការ (Manual Shift)"
              >
                <option value="វេនព្រឹក" className="bg-slate-900 text-amber-300 font-bold">
                  ☀️ {t(lang, 'shiftMorning')}
                </option>
                <option value="វេនយប់" className="bg-slate-900 text-indigo-300 font-bold">
                  🌙 {t(lang, 'shiftNight')}
                </option>
              </select>
            </div>

            {/* CS ID Selector */}
            <div className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800/90 border-slate-700/90 text-slate-200'} border rounded-lg text-xs shadow-inner`}>
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-400 text-[10px] font-bold hidden sm:inline">CS:</span>
              <input
                type="text"
                list="cs-id-options-header"
                value={activeCsId}
                onChange={(e) => onCsIdChange(e.target.value)}
                placeholder="CS ID"
                className={`bg-transparent ${isLight ? 'text-slate-900' : 'text-slate-100'} font-bold focus:outline-none w-12 sm:w-14 text-[11px]`}
              />
              <datalist id="cs-id-options-header">
                <option value="ALL" />
                {CS_ID_LIST.map(id => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-bold text-xs transition cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100'
                }`}
                title="ជ្រើសរើសភាសា (Select Language)"
              >
                <FlagIcon code={currentLangObj.code} className="w-3.5 h-2.5 rounded-xs" />
                <span className="text-[11px] font-extrabold">{currentLangObj.name}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangDropdownOpen(false)} 
                  />
                  <div className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl border shadow-2xl z-50 p-1.5 animate-fade-in ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-800' 
                      : 'bg-slate-900 border-slate-800 text-slate-100'
                  }`}>
                    <div className="px-2.5 py-1.5 border-b border-slate-700/40 mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Languages className="w-3 h-3 text-blue-400" />
                        <span>ជ្រើសរើសភាសា</span>
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {languageOptions.map((l) => {
                        const isSelected = lang === l.code;
                        return (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => {
                              onLanguageChange(l.code);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FlagIcon code={l.code} className="w-4 h-3 rounded-xs" />
                              <span className="text-[11px] font-extrabold">{l.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Light / Dark Theme Mode Toggle */}
            <button
              type="button"
              onClick={onThemeToggle}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-bold text-xs transition cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
              title={isLight ? 'ប្តូរទៅ Dark Mode' : 'ប្តូរទៅ Light Mode'}
            >
              {isLight ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span className="text-[11px]">ពន្លឺ</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px]">ងងឹត</span>
                </>
              )}
            </button>

            {/* Admin / User Gmail Management Button (Admin / Super Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs transition cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900' 
                    : 'bg-purple-950/80 hover:bg-purple-900/90 border-purple-700/80 text-purple-300'
                }`}
                title="គ្រប់គ្រង User Gmail & សិទ្ធិ Admin"
              >
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span className="hidden sm:inline">គ្រប់ User Gmail</span>
                <span className="sm:hidden">Users</span>
              </button>
            )}

            {/* About & Settings Modal Toggle Button */}
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs transition cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700' 
                  : 'bg-blue-950/60 hover:bg-blue-900/80 border-blue-800/80 text-blue-300'
              }`}
              title="អំពីប្រព័ន្ធ & ការកំណត់ (About & Settings)"
            >
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>About</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs (Desktop only - Mobile uses bottom nav) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar for Easy Phone Input */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden ${isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-900/95 border-slate-800 text-slate-200'} backdrop-blur-md border-t px-2 py-1.5 flex items-center justify-around shadow-2xl transition-colors duration-300`}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer touch-manipulation min-w-[50px] ${
                isActive
                  ? 'text-blue-500 scale-105'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-transparent'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`mt-0.5 leading-tight truncate max-w-[60px] ${isActive ? 'font-black text-blue-500 dark:text-blue-400' : 'font-medium'}`}>
                {tab.id === 'records_daily' ? 'Daily' : tab.id === 'records_all' ? 'All' : tab.label}
              </span>
            </button>
          );
        })}

        {/* About / Guide Button for Phone Users */}
        <button
          onClick={() => setIsAboutModalOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer touch-manipulation min-w-[50px] ${
            isAboutModalOpen
              ? 'text-blue-500 scale-105'
              : isLight
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="w-4 h-4" />
          </div>
          <span className="mt-0.5 leading-tight font-medium truncate max-w-[60px]">About</span>
        </button>
      </nav>

      {/* About & Mobile Usage Guide Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-3 sm:p-6 animate-fade-in flex min-h-full items-center justify-center">
          <div className={`relative w-full max-w-xl ${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-100 border-slate-800'} border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto`}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3 border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <span>អំពីប្រព័ន្ធ & ការណែនាំទូរស័ព្ទ</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">v2.5 Mobile Ready</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">CS Daily Management System Mobile & Desktop UX/UI Guide</p>
                </div>
              </div>

              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Sections */}
            <div className="space-y-4 text-xs sm:text-sm">

              {/* User Account & Login Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-blue-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>គណនីប្រើប្រាស់ (User Account):</span>
                  </span>
                  
                  {loggedInUser && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isSuperAdmin 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : isAdmin 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isSuperAdmin ? t(lang, 'superAdmin') : isAdmin ? t(lang, 'admin') : t(lang, 'staff')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {loggedInUser ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        {getUserProfilePhoto(loggedInUser) ? (
                          <img
                            src={getUserProfilePhoto(loggedInUser)}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 font-bold">
                            <Mail className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-xs font-bold text-white leading-tight">{loggedInUser}</p>
                          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>បានចូលប្រើប្រាស់ជោគជ័យ (Authenticated)</span>
                          </p>
                        </div>
                      </div>

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAboutModalOpen(false);
                            onLogout();
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t(lang, 'logout')}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xs text-slate-300">អ្នកមិនទាន់បានចូលប្រើប្រាស់ Gmail នៅឡើយទេ</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAboutModalOpen(false);
                          onOpenLoginModal();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Gmail Login</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>


              


              {/* Auto-Save & Cloud Status Section */}
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-emerald-400">Auto-Save 1s (Google Sheet Cloud Sync)</h4>
                  </div>
                </div>

                {/* Quick Action Tools inside About Modal */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {onOpenSystemUpdate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAboutModalOpen(false);
                        onOpenSystemUpdate();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                      title="ធ្វើបច្ចុប្បន្នភាពកម្មវិធី (Update System)"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update System</span>
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAboutModalOpen(false);
                          onOpenAdminModal();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                        title="គ្រប់គ្រង User Gmail & សិទ្ធិ Admin"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>គ្រប់ User Gmail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAboutModalOpen(false);
                          onOpenGasExporter();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                        title="ទាញយក / ចម្លងកូដ Google Apps Script (Code.gs)"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>GAS Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAboutModalOpen(false);
                          setIsSheetSyncOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                        title="ទាញបញ្ជូនទិន្នន័យទៅ Google Sheet តាម Token"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Sheet Sync</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition cursor-pointer"
              >
                យល់ព្រម (Got It)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sheet Sync Modal */}
      <SheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        currentWebsite={currentWebsite}
      />
    </header>
  );
};

