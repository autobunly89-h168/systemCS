import React, { useState, useEffect } from 'react';
import { CustomerRecord, WebsiteInfo, ShiftType } from '../types';
import { loadLocalRecords, fetchSharedRecordsAsync, updateCustomerRecordLocal, deleteCustomerRecordLocal, convertDDMMMYYYYToYYYYMMDD, convertYYYYMMDDToDDMMMYYYY, displayVal, sortRecordsTodayFirst, isRecordToday } from '../utils/gasHelper';
import { getWebsiteToken, getAllWebsites, addCustomWebsite, BANK_OPTIONS, CS_ID_LIST } from '../data/websites';
import { isAdminUser } from '../utils/auth';
import { Language, t } from '../utils/i18n';
import { Table, Download, Search, Filter, RefreshCw, FileSpreadsheet, Trash2, Key, CheckCircle2, ShieldCheck, Copy, Check, X, Lock, Plus, Globe, Calendar, Edit3, Save } from 'lucide-react';

interface DataTableProps {
  currentWebsite: string;
  viewMode: 'DAILY' | 'ALL';
  lang?: Language;
  onRefresh: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  currentWebsite,
  viewMode,
  lang = 'km',
  onRefresh
}) => {
  const activeLang: Language = (lang as Language) || 'km';
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterCs, setFilterCs] = useState<string>('ALL');
  const [filterDateISO, setFilterDateISO] = useState<string>('');
  const [filterWebsite, setFilterWebsite] = useState<string>(currentWebsite || 'ALL');
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedSyncFormula, setCopiedSyncFormula] = useState(false);

  // Add Custom Website Modal states
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);

  // Edit Date & Record states
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null);
  const [editRegDateISO, setEditRegDateISO] = useState('');
  const [editDepositDateISO, setEditDepositDateISO] = useState('');
  const [editProfileName, setEditProfileName] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDepositAmount, setEditDepositAmount] = useState('0.00');
  const [editWebsite, setEditWebsite] = useState('');
  const [editShift, setEditShift] = useState<ShiftType>('វេនព្រឹក');
  const [editCsId, setEditCsId] = useState('CS-01');
  const [isCustomCsId, setIsCustomCsId] = useState(false);
  const [editBankName, setEditBankName] = useState('ABA Bank');
  const [editBankAccountName, setEditBankAccountName] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editStatus, setEditStatus] = useState('New Register');

  const websiteToken = getWebsiteToken(currentWebsite);
  const formulaStr = `=FETCH_WEBSITE_DATA("${currentWebsite}", "${websiteToken}")`;

  useEffect(() => {
    setFilterWebsite(currentWebsite);
  }, [currentWebsite]);

  useEffect(() => {
    let isMounted = true;

    // Load from local storage immediately for zero delay
    setRecords(loadLocalRecords());

    const loadData = async () => {
      const all = await fetchSharedRecordsAsync();
      if (isMounted) {
        setRecords(all);
      }
    };

    loadData();

    // Listen to local record updates for instant zero-lag refresh
    const handleRecordsUpdated = () => {
      if (isMounted) {
        setRecords(loadLocalRecords());
      }
    };
    window.addEventListener('recordsUpdated', handleRecordsUpdated);

    // Poll periodically every 10s
    const intervalId = setInterval(loadData, 10000);

    return () => {
      isMounted = false;
      window.removeEventListener('recordsUpdated', handleRecordsUpdated);
      clearInterval(intervalId);
    };
  }, [viewMode]);

  const handleManualRefresh = async () => {
    const all = await fetchSharedRecordsAsync();
    setRecords(all);
    onRefresh();
  };

  const handleOpenEditModal = (r: CustomerRecord) => {
    setEditingRecord(r);
    setEditRegDateISO(convertDDMMMYYYYToYYYYMMDD(r.regDate));
    setEditDepositDateISO(r.depositDate || convertDDMMMYYYYToYYYYMMDD(r.regDate));
    setEditProfileName(r.profileName);
    setEditCustomerId(r.customerId || '');
    setEditPassword(r.password || '');
    setEditDepositAmount(r.depositAmount?.toString() || '0.00');
    setEditWebsite(r.website || currentWebsite);
    setEditShift(r.shift as ShiftType || 'វេនព្រឹក');
    
    if (r.csId && !CS_ID_LIST.includes(r.csId)) {
      setIsCustomCsId(true);
      setEditCsId(r.csId);
    } else {
      setIsCustomCsId(false);
      setEditCsId(r.csId || 'CS-01');
    }

    setEditBankName(r.bankName || 'ABA Bank');
    setEditBankAccountName(r.bankAccountName || '');
    setEditBankAccountNumber(r.bankAccountNumber || '');
    setEditStatus(r.status || 'New Register');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const formattedRegDate = convertYYYYMMDDToDDMMMYYYY(editRegDateISO);

    const updated = updateCustomerRecordLocal(editingRecord.id, {
      regDate: formattedRegDate,
      depositDate: editDepositDateISO,
      profileName: editProfileName.trim() || editingRecord.profileName,
      customerId: editCustomerId.trim() || '-',
      password: editPassword.trim() || '-',
      depositAmount: parseFloat(editDepositAmount) || 0,
      website: editWebsite,
      shift: editShift,
      csId: editCsId,
      bankName: editBankName,
      bankAccountName: editBankAccountName.trim() || '-',
      bankAccountNumber: editBankAccountNumber.trim() || '-',
      status: editStatus
    });

    if (updated) {
      setRecords(prev => prev.map(rec => rec.id === updated.id ? updated : rec));
      setEditingRecord(null);
      onRefresh();
    }
  };

  const handleDeleteRecord = (id: string, recordToDel?: CustomerRecord) => {
    if (confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ? (ទិន្នន័យនឹងត្រូវលុបចេញពីប្រព័ន្ធចងចាំ Data/Google Sheet ជាអចិន្ត្រៃយ៍ ដោយមិនទាញយកមកវិញឡើយ)')) {
      const rec = recordToDel || (editingRecord?.id === id ? editingRecord : records.find(r => r.id === id));
      deleteCustomerRecordLocal(id, rec || undefined);
      setRecords(prev => prev.filter(r => r.id !== id));
      setEditingRecord(null);
      onRefresh();
    }
  };

  const handleOpenAddWebsite = () => {
    if (!isAdminUser()) {
      setShowAdminLockNotice(true);
      return;
    }
    setShowAddWebsiteModal(true);
  };

  const handleSaveWebsite = () => {
    const trimmed = newWebsiteInput.trim();
    if (!trimmed) return;
    const newWeb = addCustomWebsite(trimmed);
    const updated = getAllWebsites();
    setWebsites(updated);
    setFilterWebsite(newWeb.name);
    setNewWebsiteInput('');
    setShowAddWebsiteModal(false);
  };

  // Filter and sort records (Today's records appear first at the top)
  const filteredRecords = records.filter(r => {
    const matchWebsite = filterWebsite === 'ALL' || r.website === filterWebsite;
    const matchShift = filterShift === 'ALL' || r.shift === filterShift;
    const matchCs = !filterCs || filterCs === 'ALL' || (r.csId || '').toLowerCase().includes(filterCs.toLowerCase().trim());
    
    // Date filter
    let matchDate = true;
    if (filterDateISO) {
      const selectedDDMMM = convertYYYYMMDDToDDMMMYYYY(filterDateISO).toLowerCase().trim();
      const regDDMMM = (r.regDate || '').toLowerCase().trim();
      const regISO = convertDDMMMYYYYToYYYYMMDD(r.regDate || '').toLowerCase().trim();
      const depISO = (r.depositDate || '').toLowerCase().trim();
      matchDate = regDDMMM === selectedDDMMM || regISO === filterDateISO || depISO === filterDateISO;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q ||
      (r.profileName || '').toLowerCase().includes(q) ||
      (r.customerId || '').toLowerCase().includes(q) ||
      (r.password || '').toLowerCase().includes(q) ||
      (r.platform || '').toLowerCase().includes(q) ||
      (r.sourceName || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.contactLink || '').toLowerCase().includes(q) ||
      (r.bankName || '').toLowerCase().includes(q) ||
      (r.bankAccountName || '').toLowerCase().includes(q) ||
      (r.bankAccountNumber || '').toLowerCase().includes(q) ||
      (r.regDate || '').toLowerCase().includes(q) ||
      (r.depositDate || '').toLowerCase().includes(q) ||
      (r.shift || '').toLowerCase().includes(q) ||
      (r.csId || '').toLowerCase().includes(q) ||
      (r.website || '').toLowerCase().includes(q) ||
      String(r.serialNo || '').includes(q) ||
      String(r.depositAmount || '').includes(q);

    return matchWebsite && matchShift && matchCs && matchDate && matchQ;
  });

  const displayRecords = sortRecordsTodayFirst(filteredRecords);

  // Export to CSV
  const exportCSV = () => {
    const headers = [
      "Serial No", "Reg Date", "Profile Name", "Customer ID", "Password",
      "Platform", "Source", "Status", "Contact/Phone", "Deposit Amount",
      "Deposit Date", "Bank", "Account Name", "Account No", "Shift", "CS ID", "Website"
    ];

    const csvRows = [
      headers.join(','),
      ...displayRecords.map(r => [
        r.serialNo,
        `"${r.regDate}"`,
        `"${r.profileName}"`,
        `"${r.customerId}"`,
        `"${r.password}"`,
        `"${r.platform}"`,
        `"${r.sourceName}"`,
        `"${r.status}"`,
        `"${r.contactLink}"`,
        r.depositAmount,
        `"${r.depositDate}"`,
        `"${r.bankName}"`,
        `"${r.bankAccountName}"`,
        `"${r.bankAccountNumber}"`,
        `"${r.shift}"`,
        `"${r.csId}"`,
        `"${r.website}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentWebsite}_${viewMode}_Data_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const totalDepositSum = displayRecords.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
  const uniqueCsOptions = Array.from(new Set(records.map((r: CustomerRecord) => String(r.csId || '')))).filter((c: string) => Boolean(c) && !['CS-01','CS-02','CS-03','CS-04','CS-05','ALL'].includes(c));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Table Header & Controls */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-md">
                {currentWebsite}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {viewMode === 'DAILY' ? 'Start Row: 16 (Register Daily)' : 'Start Row: 4 (Data All)'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>{viewMode === 'DAILY' ? t(activeLang, 'dailyRegisterTable') : t(activeLang, 'summaryDataTable')}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdminUser() ? (
              <>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  title={t(activeLang, 'syncSheetViaToken')}
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>{t(activeLang, 'syncSheetViaToken')}</span>
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t(activeLang, 'adminOnly')}</span>
              </div>
            )}
            <button
              onClick={handleManualRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Website Filter */}
          <div>
            <select
              value={filterWebsite}
              onChange={(e) => setFilterWebsite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">{t(activeLang, 'all26Websites')} ({websites.length})</option>
              {websites.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(activeLang, 'searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Filter & Quick Buttons */}
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={filterDateISO}
                  onChange={(e) => setFilterDateISO(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                  title="ជ្រើសរើសកាលបរិច្ឆេទតម្រង (Filter by date)"
                />
                {filterDateISO && (
                  <button
                    type="button"
                    onClick={() => setFilterDateISO('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                    title="លុបកាលបរិច្ឆេទ"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Date Shortcuts */}
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setFilterDateISO(today);
                }}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  filterDateISO === new Date().toISOString().split('T')[0]
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>ថ្ងៃនេះ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setFilterDateISO(y.toISOString().split('T')[0]);
                }}
                className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  filterDateISO === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <span>ម្សិលមិញ</span>
              </button>

              {filterDateISO && (
                <button
                  type="button"
                  onClick={() => setFilterDateISO('')}
                  className="px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer"
                  title="បង្ហាញទាំងអស់"
                >
                  ទាំងអស់
                </button>
              )}
            </div>
          </div>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">{t(activeLang, 'allShifts')}</option>
            <option value="វេនព្រឹក">{t(activeLang, 'shiftMorning')}</option>
            <option value="វេនយប់">{t(activeLang, 'shiftNight')}</option>
          </select>

          {/* CS ID Filter (Manual Input & Datalist) */}
          <div className="relative">
            <input
              type="text"
              list="cs-filter-options"
              value={filterCs}
              onChange={(e) => setFilterCs(e.target.value)}
              placeholder="CS ID (e.g. ALL, CS-01)..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
            <datalist id="cs-filter-options">
              <option value="ALL">ALL CS</option>
              <option value="CS-01" />
              <option value="CS-02" />
              <option value="CS-03" />
              <option value="CS-04" />
              <option value="CS-05" />
              {uniqueCsOptions.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <div>
          {t(activeLang, 'recordsFound')}: {displayRecords.length}
        </div>
        <div className="font-bold text-emerald-400 text-sm">
          {t(activeLang, 'totalAmountDollar')}: ${totalDepositSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto overflow-y-auto max-h-[75vh] sm:max-h-[65vh] touch-pan-x touch-pan-y overscroll-contain">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider sticky top-0 z-10 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3 border-r border-slate-700/50">Serial</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[130px] text-blue-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reg Date</span>
                  </div>
                </th>
                <th className="p-3 border-r border-slate-700/50 min-w-[140px]">Profile Name</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[120px]">Customer ID</th>
                <th className="p-3 border-r border-slate-700/50">Password</th>
                <th className="p-3 border-r border-slate-700/50">Platform</th>
                <th className="p-3 border-r border-slate-700/50">Source</th>
                <th className="p-3 border-r border-slate-700/50">Status</th>
                <th className="p-3 border-r border-slate-700/50">Link / Phone</th>
                <th className="p-3 border-r border-slate-700/50 text-right text-emerald-400">Deposit ($)</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[120px] text-purple-300">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deposit Date</span>
                  </div>
                </th>
                <th className="p-3 border-r border-slate-700/50">Bank</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[120px]">Account Name</th>
                <th className="p-3 border-r border-slate-700/50">Account No</th>
                <th className="p-3 border-r border-slate-700/50">Shift</th>
                <th className="p-3 border-r border-slate-700/50">CS ID</th>
                <th className="p-3 border-r border-slate-700/50">Website</th>
                <th className="p-3 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {displayRecords.map((r, idx) => {
                const isToday = isRecordToday(r);
                return (
                  <tr key={r.id || idx} className={`${isToday ? 'bg-slate-900/90 hover:bg-slate-800/80 border-l-2 border-l-emerald-400' : 'hover:bg-slate-800/50'} transition group`}>
                    <td className="p-3 border-r border-slate-800/50 font-mono font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>#{r.serialNo}</span>
                        {isToday && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-950/70 text-teal-300 border border-teal-500/50 text-[10px] font-bold rounded-lg shadow-sm">
                            <Calendar className="w-2.5 h-2.5 text-teal-400" />
                            <span>ថ្ងៃនេះ</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(r)}
                        title="ចុចដើម្បីកែប្រែកាលបរិច្ឆេទ (Click to edit date)"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isToday ? 'bg-teal-950/60 text-teal-300 border border-teal-500/50 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700'} text-xs font-semibold transition cursor-pointer`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        <span>{r.regDate}</span>
                        <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    </td>
                  <td className="p-3 border-r border-slate-800/50 font-bold text-white whitespace-nowrap">{displayVal(r.profileName)}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-blue-300 whitespace-nowrap">{displayVal(r.customerId)}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-slate-400">{displayVal(r.password)}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{displayVal(r.platform)}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{displayVal(r.sourceName)}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      r.status?.includes('Deposit')
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : r.status === 'Come in'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {displayVal(r.status)}
                    </span>
                  </td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-blue-400 max-w-[140px] truncate">{displayVal(r.contactLink)}</td>
                  <td className="p-3 border-r border-slate-800/50 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                    ${r.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(r)}
                      title="ចុចដើម្បីកែប្រែកាលបរិច្ឆេទប្រាក់បញ្ញើ"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span>{r.depositDate || r.regDate}</span>
                    </button>
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{displayVal(r.bankName)}</td>
                  <td className="p-3 border-r border-slate-800/50 uppercase whitespace-nowrap">{displayVal(r.bankAccountName)}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono whitespace-nowrap">{displayVal(r.bankAccountNumber)}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.shift}</td>
                  <td className="p-3 border-r border-slate-800/50 font-semibold text-slate-300">{r.csId}</td>
                  <td className="p-3 border-r border-slate-800/50 font-bold text-amber-400">{r.website}</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold rounded-lg transition cursor-pointer"
                        title="កែប្រែកាលបរិច្ឆេទ និងព័ត៌មាន (Edit Record)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id, r)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold rounded-lg transition cursor-pointer"
                        title="លុបទិន្នន័យចេញពីប្រព័ន្ធចងចាំ Data/Sheet ជាអចិន្ត្រៃយ៍"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>លុប</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan={18} className="p-12 text-center text-slate-500">
                    {t(activeLang, 'noDataToday')} ({currentWebsite})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheet Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Google Sheet Token Sync Connected
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t(activeLang, 'websiteLabel')} <span className="font-bold text-amber-400">{currentWebsite}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold text-emerald-300">
                  {t(activeLang, 'connectCSDaily')}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {currentWebsite} ({displayRecords.length} rows)<br />
                  <span className="text-[11px] text-amber-300 font-mono">Serial No, Reg Date, Profile Name, Customer ID, Password, Platform, Source, Status, Link / Phone, Deposit ($), Deposit Date, Bank, Account Name, Account No, Shift, CS ID, Website</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Website Security Token:
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-amber-400 text-xs font-bold">
                <span>{websiteToken}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  VERIFIED TOKEN
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                {t(activeLang, 'formulaMethodHeader')}
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-blue-300">
                <span className="truncate mr-2">{formulaStr}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formulaStr);
                    setCopiedSyncFormula(true);
                    setTimeout(() => setCopiedSyncFormula(false), 2500);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition shrink-0 cursor-pointer"
                >
                  {copiedSyncFormula ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSyncFormula ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSyncModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                {t(activeLang, 'closeWindow')}
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
                    handleSaveWebsite();
                  }
                }}
                placeholder="FAFA555, SBOBET99, ROYAL777"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
              />
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
                onClick={handleSaveWebsite}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
              >
                {t(activeLang, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Date & Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto touch-pan-y overscroll-contain my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    កែប្រែកាលបរិច្ឆេទ & ទិន្នន័យ (Edit Date & Record)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingRecord.profileName} • <span className="font-bold text-amber-400">{editingRecord.website}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Date Edit Fields Section */}
              <div className="p-4 bg-slate-950/80 border border-blue-500/30 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>កែប្រែកាលបរិច្ឆេទ (Edit Dates for All Websites)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reg Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      កាលបរិច្ឆេទចុះឈ្មោះ (Reg Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={editRegDateISO}
                      onChange={(e) => setEditRegDateISO(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      ទម្រង់: {convertYYYYMMDDToDDMMMYYYY(editRegDateISO)}
                    </span>
                  </div>

                  {/* Deposit Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Deposit Date
                    </label>
                    <input
                      type="date"
                      value={editDepositDateISO}
                      onChange={(e) => setEditDepositDateISO(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      ISO: {editDepositDateISO || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Other Record Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Profile Name</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    placeholder="កំណត់ដោយដៃ ឬ - បើគ្មាន"
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randPass = 'Pass' + Math.floor(1000 + Math.random() * 9000);
                        setEditPassword(randPass);
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>បង្កើតស្វ័យប្រវត្តិ</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="កំណត់ដោយដៃ ឬ - បើគ្មាន"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1"> Deposit Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDepositAmount}
                    onChange={(e) => setEditDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Website</label>
                  <select
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {websites.map(w => (
                      <option key={w.name} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Shift</label>
                  <select
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="វេនព្រឹក">វេនព្រឹក (Day Shift)</option>
                    <option value="វេនយប់">វេនយប់ (Night Shift)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">CS ID</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCsId(!isCustomCsId);
                        if (!isCustomCsId) setEditCsId('');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                    >
                      {isCustomCsId ? 'ជ្រើសរើសពីបញ្ជី' : 'កំណត់ដោយដៃ'}
                    </button>
                  </div>
                  {isCustomCsId ? (
                    <input
                      type="text"
                      placeholder="បញ្ចូល CS ID (ឧ. CS-88)"
                      value={editCsId}
                      onChange={(e) => setEditCsId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <select
                      value={editCsId}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomCsId(true);
                          setEditCsId('');
                        } else {
                          setEditCsId(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {CS_ID_LIST.map(cs => (
                        <option key={cs} value={cs}>{cs}</option>
                      ))}
                      <option value="CUSTOM">✍️ កំណត់ដោយដៃ (Manual Input...)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    ស្ថានភាព (Status)
                  </label>
                  <input
                    type="text"
                    list="status-edit-options"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    placeholder="ជ្រើសរើស ឬ វាយបញ្ចូលដោយដៃ..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <datalist id="status-edit-options">
                    <option value="New Register" />
                    <option value="Come in" />
                    <option value="Deposit Add" />
                    <option value="Deposit" />
                  </datalist>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(editingRecord.id)}
                  className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>លុបទិន្នន័យ</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>រក្សាទុកកាលបរិច្ឆេទ & ទិន្នន័យ</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
