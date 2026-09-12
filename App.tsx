import React, { useState, useEffect } from 'react';
import { WEBSITE_LIST, syncSharedWebsites } from './data/websites';
import { CustomerRecord, DashboardStats } from './types';
import {
  SELECTED_WEBSITE_KEY,
  SELECTED_CS_ID_KEY,
  getLiveDashboardDataLocal,
  loadLocalRecords,
  fetchSharedRecordsAsync,
  pullFromGoogleSheetApi,
  startAutoSaveToGoogleSheetInterval
} from './utils/gasHelper';
import {
  getLoggedInUser,
  isAdminUser,
  isSuperAdmin,
  logoutUser,
  SUPER_ADMIN_EMAIL,
  fetchSharedAdminsAsync,
  pingActiveUserAsync
} from './utils/auth';
import {
  Language,
  Theme,
  getStoredLanguage,
  setStoredLanguage,
  getStoredTheme,
  setStoredTheme,
  t
} from './utils/i18n';
import { Header } from './components/Header';
import { WebsiteSelectorModal } from './components/WebsiteSelectorModal';
import { LiveDashboard } from './components/LiveDashboard';
import { RegistrationForm } from './components/RegistrationForm';
import { CustomerSearch } from './components/CustomerSearch';
import { DataTable } from './components/DataTable';
import { ReportGenerator } from './components/ReportGenerator';
import { GasCodeExporter } from './components/GasCodeExporter';
import { LoginModal } from './components/LoginModal';
import { AdminManagementModal } from './components/AdminManagementModal';
import { SystemUpdateModal } from './components/SystemUpdateModal';
import { ActiveUsersMarquee } from './components/ActiveUsersMarquee';
import { Globe, ShieldCheck, Sparkles, PlusCircle, LayoutDashboard, ArrowLeftRight } from 'lucide-react';

export default function App() {
  // Language & Theme State
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const handleThemeToggle = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  // Auth State
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return getLoggedInUser();
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminVersion, setAdminVersion] = useState<number>(0);

  const isAdmin = isAdminUser(loggedInUser);
  const isSuper = isSuperAdmin(loggedInUser);

  // Website Selection State
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_WEBSITE_KEY) || 'K9WIN';
  });
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem(SELECTED_WEBSITE_KEY);
  });

  // Navigation & CS ID
  const [activeTab, setActiveTab] = useState<string>('register');
  const [activeCsId, setActiveCsId] = useState<string>(() => {
    return localStorage.getItem(SELECTED_CS_ID_KEY) || 'ALL';
  });

  // Modal State
  const [isGasExporterOpen, setIsGasExporterOpen] = useState<boolean>(false);
  const [isSystemUpdateOpen, setIsSystemUpdateOpen] = useState<boolean>(false);

  // Live Stats State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(() => {
    return getLiveDashboardDataLocal(selectedWebsite || 'K9WIN', activeCsId);
  });

  // Refresh Dashboard stats
  const refreshStats = () => {
    const stats = getLiveDashboardDataLocal(selectedWebsite || 'K9WIN', activeCsId);
    setDashboardStats(stats);
  };

  // Initial data restore and sync on initial mount
  useEffect(() => {
    let isMounted = true;

    // Pull once on startup to restore data from Google Sheet if needed
    pullFromGoogleSheetApi().catch(() => {}).finally(() => {
      if (isMounted) {
        Promise.all([
          fetchSharedRecordsAsync(),
          fetchSharedAdminsAsync(),
          syncSharedWebsites()
        ]).then(() => {
          if (isMounted) {
            refreshStats();
            setAdminVersion(v => v + 1);
          }
        });
      }
    });

    // Start background auto-save loop (every 15s)
    const stopAutoSave = startAutoSaveToGoogleSheetInterval(15000);

    return () => {
      isMounted = false;
      stopAutoSave();
    };
  }, []);

  // Refresh dashboard stats instantly whenever website or CS ID filter changes
  useEffect(() => {
    refreshStats();
  }, [selectedWebsite, activeCsId]);

  // Periodic polling (every 10s) across all connected Gmail users / devices
  useEffect(() => {
    let isMounted = true;

    const syncAndRefresh = async () => {
      await Promise.all([
        fetchSharedRecordsAsync(),
        fetchSharedAdminsAsync(),
        syncSharedWebsites()
      ]);

      if (loggedInUser) {
        const pingRes = await pingActiveUserAsync(loggedInUser);
        if (pingRes && pingRes.blocked) {
          logoutUser();
          if (isMounted) {
            setLoggedInUser(null);
            setBlockedNotice(pingRes.message || 'អាសយដ្ឋាន Gmail របស់អ្នកត្រូវបាន Admin លុបសិទ្ធិ និងហាមឃាត់មិនឱ្យចូលប្រើប្រាស់!');
            setIsLoginModalOpen(true);
          }
        }
      }

      if (isMounted) {
        refreshStats();
        setAdminVersion(v => v + 1);
      }
    };

    const intervalId = setInterval(syncAndRefresh, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [loggedInUser]);

  // Handle Login success
  const handleLoginSuccess = (email: string) => {
    setLoggedInUser(email);
    setBlockedNotice(null);
    setIsLoginModalOpen(false);
    setIsWebsiteModalOpen(true);
    setActiveTab('register');
  };

  // Handle Logout
  const handleLogout = () => {
    logoutUser();
    setLoggedInUser(null);
  };

  // Handle website selection
  const handleSelectWebsite = (websiteName: string) => {
    setSelectedWebsite(websiteName);
    localStorage.setItem(SELECTED_WEBSITE_KEY, websiteName);
    setIsWebsiteModalOpen(false);
    refreshStats();
  };

  const handleCsIdChange = (csId: string) => {
    setActiveCsId(csId);
    localStorage.setItem(SELECTED_CS_ID_KEY, csId);
  };

  // Quick Deposit shortcut handler from Customer Search
  const handleQuickDepositClick = (record: CustomerRecord) => {
    // Switch website if different
    if (record.website && record.website !== selectedWebsite) {
      setSelectedWebsite(record.website);
      localStorage.setItem(SELECTED_WEBSITE_KEY, record.website);
    }
    setActiveTab('register');
  };

  const currentWebsite = selectedWebsite || 'K9WIN';
  const isLight = theme === 'light';

  // Mandatory Full-Screen Auth Gate: Lock whole app if user is not logged in
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
        <LoginModal
          isOpen={true}
          onLoginSuccess={handleLoginSuccess}
          canClose={false}
          lang={lang}
          onLanguageChange={handleLanguageChange}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300`}>
      {/* Top Header */}
      <Header
        currentWebsite={currentWebsite}
        onChangeWebsiteClick={() => setIsWebsiteModalOpen(true)}
        activeCsId={activeCsId}
        onCsIdChange={handleCsIdChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenGasExporter={() => setIsGasExporterOpen(true)}
        loggedInUser={loggedInUser}
        isAdmin={isAdmin}
        isSuperAdmin={isSuper}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onLogout={handleLogout}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onShiftChange={refreshStats}
        onOpenSystemUpdate={() => setIsSystemUpdateOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {activeTab === 'dashboard' && (
          <LiveDashboard
            currentWebsite={currentWebsite}
            activeCsId={activeCsId}
            stats={dashboardStats}
            lang={lang}
            onNavigateToRegister={() => setActiveTab('register')}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'register' && (
          <RegistrationForm
            currentWebsite={currentWebsite}
            activeCsId={activeCsId}
            lang={lang}
            onSuccessSubmit={refreshStats}
          />
        )}

        {activeTab === 'search' && (
          <CustomerSearch
            currentWebsite={currentWebsite}
            lang={lang}
            onQuickDepositClick={handleQuickDepositClick}
          />
        )}

        {activeTab === 'records_daily' && (
          <DataTable
            currentWebsite={currentWebsite}
            viewMode="DAILY"
            lang={lang}
            onRefresh={refreshStats}
          />
        )}

        {activeTab === 'records_all' && (
          <DataTable
            currentWebsite={currentWebsite}
            viewMode="ALL"
            lang={lang}
            onRefresh={refreshStats}
          />
        )}

        {activeTab === 'reports' && (
          <ReportGenerator currentWebsite={currentWebsite} lang={lang} />
        )}
      </main>

      {/* Live Running Active Users Marquee (Right to Left) */}
      <ActiveUsersMarquee loggedInUser={loggedInUser} isLight={isLight} />

      {/* Footer */}
      <footer className={`${isLight ? 'bg-white border-t border-slate-200 text-slate-600' : 'bg-slate-900 border-t border-slate-800 text-slate-400'} py-4 text-xs transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t(lang, 'systemTitle')} • {isAdmin ? 'Admin Authorized' : 'CS Staff'}</span>
          </div>
          <span>
            {t(lang, 'loggedAs')} <strong className={`${isLight ? 'text-slate-800' : 'text-slate-200'} font-mono`}>{loggedInUser}</strong>
          </span>
        </div>
      </footer>

      {/* Gmail Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginModalOpen(false)}
        canClose={!!loggedInUser}
        lang={lang}
        onLanguageChange={setLang}
        blockedMessage={blockedNotice}
      />

      {/* Admin Management Modal */}
      <AdminManagementModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        lang={lang}
        onAdminChange={() => setAdminVersion(v => v + 1)}
      />

      {/* Website Selector Gate Modal */}
      <WebsiteSelectorModal
        isOpen={isWebsiteModalOpen}
        selectedWebsite={selectedWebsite}
        onSelectWebsite={handleSelectWebsite}
        onClose={() => setIsWebsiteModalOpen(false)}
        canClose={!!selectedWebsite}
        isAdmin={isAdmin}
        lang={lang}
        onLanguageChange={setLang}
      />

      {/* Google Apps Script Code Exporter Modal (Admin Only) */}
      <GasCodeExporter
        isOpen={isGasExporterOpen && isAdmin}
        onClose={() => setIsGasExporterOpen(false)}
      />

      {/* System Update & Data Protection Modal */}
      <SystemUpdateModal
        isOpen={isSystemUpdateOpen}
        onClose={() => setIsSystemUpdateOpen(false)}
        lang={lang}
        onUpdateComplete={refreshStats}
      />
    </div>
  );
}
