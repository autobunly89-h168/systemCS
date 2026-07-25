import React, { useState, useEffect } from 'react';
import { WEBSITE_LIST, CS_ID_LIST, getWebsiteToken } from '../data/websites';
import { getCurrentShift, saveManualShift } from '../utils/gasHelper';
import { Language, Theme, t } from '../utils/i18n';
import { Clock, User, Code2, ArrowLeftRight, ShieldCheck, Sun, Moon, LayoutDashboard, UserPlus, Search, Table, FileSpreadsheet, BarChart3, Key, Copy, Check, Mail, LogOut, Lock, Languages, ChevronDown } from 'lucide-react';
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
  onShiftChange
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [currentShift, setCurrentShift] = useState<'វេនព្រឹក' | 'វេនយប់'>('វេនព្រឹក');
  const [copiedToken, setCopiedToken] = useState(false);
  const [isSheetSyncOpen, setIsSheetSyncOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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

  const websiteObj = WEBSITE_LIST.find(w => w.name === currentWebsite) || WEBSITE_LIST[0];

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
    <header className={`${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'} border-b sticky top-0 z-40 shadow-xl transition-colors duration-300`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col md:flex-row items-center justify-between py-3.5 gap-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          
          {/* Logo & Website Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className={`relative overflow-hidden p-1 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-700/80'} border rounded-xl shadow-md group`}>
                <img
                  src={csIcon}
                  alt="CS DAILY SYSTEM Logo Icon"
                  className="w-10 h-10 object-cover rounded-lg transform group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-lg font-extrabold leading-tight flex items-center gap-2 tracking-tight">
                  <span className={isLight ? "bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent"}>
                    {t(lang, 'systemTitle')}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-500 dark:text-blue-300 rounded-full shadow-sm">
                    {t(lang, 'gasBadge')}
                  </span>
                </h1>
                <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t(lang, 'systemSubtitle')}</p>
              </div>
            </div>

            {/* Active Website Badge & Token (Only for Admin) */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800/90 border-slate-700 text-white'} font-bold text-sm shadow-inner`}>
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${websiteObj.color} animate-pulse`} />
                <span>{currentWebsite}</span>
              </div>

              {/* Website Security Token Badge - ADMIN ONLY */}
              {isAdmin ? (
                <button
                  onClick={handleCopyToken}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="ចុចដើម្បីចម្លង Website Security Token សម្រាប់ Google Sheets"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="font-mono text-[11px]">{websiteToken}</span>
                  {copiedToken ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-500 shrink-0 opacity-70 hover:opacity-100" />
                  )}
                </button>
              ) : (
                <div className={`flex items-center gap-1 px-2.5 py-1.5 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700/80'} border rounded-xl text-[11px] text-slate-400`} title="Security Token លាក់សម្រាប់សមាជិកធម្មតា (Admin Only)">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="font-mono text-[10px] tracking-wider text-slate-400">••••••••••</span>
                </div>
              )}

              <button
                onClick={onChangeWebsiteClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-600 dark:text-blue-300 hover:text-blue-500 border border-blue-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="ប្តូរវេបសាយ (Switch Website)"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{t(lang, 'switchWebsite')}</span>
              </button>
            </div>
          </div>

          {/* Right Controls: User Profile, Language Selector, Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end flex-wrap pb-1 md:pb-0">
            
            {/* Language Switcher Bar with Flags for All 3 Languages */}
            <div className="relative flex items-center">
              <div className={`flex items-center p-1 rounded-xl border ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/90 border-slate-700'
              } text-xs font-bold gap-1 shadow-sm`}>
                <button
                  type="button"
                  onClick={() => onLanguageChange('km')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    lang === 'km'
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="ភាសាខ្មែរ (Khmer)"
                >
                  <span className="text-sm leading-none">🇰🇭</span>
                  <span>ខ្មែរ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    lang === 'en'
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="English"
                >
                  <span className="text-sm leading-none">🇺🇸</span>
                  <span>EN</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange('zh')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    lang === 'zh'
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title="中文 (Chinese)"
                >
                  <span className="text-sm leading-none">🇨🇳</span>
                  <span>中文</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isLight 
                      ? 'hover:bg-slate-200 text-slate-500' 
                      : 'hover:bg-slate-700 text-slate-400'
                  }`}
                  title="ជ្រើសរើសភាសា (List View)"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
                </button>
              </div>

              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangDropdownOpen(false)} 
                  />
                  <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-2xl z-50 p-1.5 animate-fade-in ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-800' 
                      : 'bg-slate-900 border-slate-800 text-slate-100'
                  }`}>
                    <div className="px-3 py-2 border-b border-slate-700/40 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-blue-400" />
                        <span>ជ្រើសរើសភាសា (Languages)</span>
                      </span>
                    </div>
                    <div className="space-y-1">
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
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl leading-none">{l.flag}</span>
                              <div className="text-left">
                                <div className="leading-tight font-extrabold">{l.name}</div>
                                <div className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {l.label}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Light / Dark Theme Mode Toggle Button */}
            <button
              onClick={onThemeToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition cursor-pointer shadow-sm ${
                isLight 
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
              }`}
              title={isLight ? 'ប្តូរទៅ Dark Mode (ងងឹត)' : 'ប្តូរទៅ Light Mode (ពន្លឺ)'}
            >
              {isLight ? (
                <>
                  <Sun className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>{t(lang, 'lightMode')}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{t(lang, 'darkMode')}</span>
                </>
              )}
            </button>

            {/* User Profile & Gmail Login Status */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenLoginModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'} border rounded-xl text-xs font-medium transition cursor-pointer`}
                title="ប្តូរអាសយដ្ឋាន Gmail / ចូលប្រើប្រាស់"
              >
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono text-[11px] truncate max-w-[100px] sm:max-w-[140px]">
                  {loggedInUser || 'Gmail Login'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isSuperAdmin 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30' 
                    : isAdmin 
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {isSuperAdmin ? t(lang, 'superAdmin') : isAdmin ? t(lang, 'admin') : t(lang, 'staff')}
                </span>
              </button>

              {/* Logout Button */}
              {loggedInUser && onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="ចាកចេញពីប្រព័ន្ធ (Logout)"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline text-[11px]">ចាកចេញ</span>
                </button>
              )}

              {/* Admin Gmail Management Button (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={onOpenAdminModal}
                  className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="គ្រប់គ្រង Admin Gmails (បន្ថែម ឬ លុប Admin)"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span className="hidden xl:inline text-[11px]">{t(lang, 'addManageAdmin')}</span>
                </button>
              )}
            </div>

            {/* Live Clock & Manual Shift Indicator */}
            <div className={`flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800/80 border-slate-700/80 text-slate-200'} border rounded-xl text-xs`}>
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono font-medium text-[11px]">{timeStr}</span>
              <div className="flex items-center gap-1">
                <select
                  value={currentShift}
                  onChange={(e) => {
                    const selected = e.target.value as 'វេនព្រឹក' | 'វេនយប់';
                    setCurrentShift(selected);
                    saveManualShift(selected);
                    if (onShiftChange) onShiftChange(selected);
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer outline-none transition border ${
                    currentShift === 'វេនព្រឹក'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40'
                  }`}
                  title="ជ្រើសរើសវេនធ្វើការដោយដៃ (Manual Shift Selection)"
                >
                  <option value="វេនព្រឹក" className="bg-slate-900 text-amber-300 font-bold">
                    ☀️ {t(lang, 'shiftMorning')}
                  </option>
                  <option value="វេនយប់" className="bg-slate-900 text-indigo-300 font-bold">
                    🌙 {t(lang, 'shiftNight')}
                  </option>
                </select>
              </div>
            </div>

            {/* CS ID Selector / Manual Input */}
            <div className={`flex items-center gap-1 px-2 py-1.5 ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700/80'} border rounded-xl text-xs`}>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 text-[11px] hidden sm:inline">CS:</span>
              <input
                type="text"
                list="cs-id-options"
                value={activeCsId}
                onChange={(e) => onCsIdChange(e.target.value)}
                placeholder="CS ID"
                className={`bg-transparent ${isLight ? 'text-slate-900' : 'text-slate-100'} font-bold focus:outline-none w-16 text-xs`}
              />
              <datalist id="cs-id-options">
                <option value="ALL" />
                {CS_ID_LIST.map(id => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>

            {/* GAS Code Export & Token Sync - ADMIN ONLY */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGasExporter}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="ទាញយក / ចម្លងកូដ Google Apps Script (Code.gs) & Security Tokens"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden lg:inline text-[11px]">{t(lang, 'codeGsTokens')}</span>
                </button>

                <button
                  onClick={() => setIsSheetSyncOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
                  title="ទាញបញ្ជូនទិន្នន័យទៅ Google Sheet តាម Token ស្វ័យប្រវត្តិ"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xl:inline text-[11px]">{t(lang, 'syncSheet')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border border-blue-500'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sheet Sync Modal */}
      <SheetSyncModal
        isOpen={isSheetSyncOpen}
        onClose={() => setIsSheetSyncOpen(false)}
        currentWebsite={currentWebsite}
      />
    </header>
  );
};

