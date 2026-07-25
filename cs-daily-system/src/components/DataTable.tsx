import React, { useState, useEffect } from 'react';
import { CustomerRecord, WebsiteInfo } from '../types';
import { loadLocalRecords, fetchSharedRecordsAsync } from '../utils/gasHelper';
import { getWebsiteToken, getAllWebsites, addCustomWebsite } from '../data/websites';
import { isAdminUser } from '../utils/auth';
import { Language, t } from '../utils/i18n';
import { Table, Download, Search, Filter, RefreshCw, FileSpreadsheet, Trash2, Key, CheckCircle2, ShieldCheck, Copy, Check, X, Lock, Plus, Globe } from 'lucide-react';

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
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterCs, setFilterCs] = useState<string>('ALL');
  const [filterWebsite, setFilterWebsite] = useState<string>(currentWebsite || 'ALL');
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedSyncFormula, setCopiedSyncFormula] = useState(false);

  // Add Custom Website Modal states
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);

  const websiteToken = getWebsiteToken(currentWebsite);
  const formulaStr = `=FETCH_WEBSITE_DATA("${currentWebsite}", "${websiteToken}")`;

  useEffect(() => {
    setFilterWebsite(currentWebsite);
  }, [currentWebsite]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const all = await fetchSharedRecordsAsync();
      if (isMounted) {
        setRecords(all);
      }
    };

    loadData();
    const intervalId = setInterval(loadData, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [viewMode]);

  const handleManualRefresh = async () => {
    const all = await fetchSharedRecordsAsync();
    setRecords(all);
    onRefresh();
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

  // Filter records
  const displayRecords = records.filter(r => {
    const matchWebsite = filterWebsite === 'ALL' || r.website === filterWebsite;
    const matchShift = filterShift === 'ALL' || r.shift === filterShift;
    const matchCs = !filterCs || filterCs === 'ALL' || (r.csId || '').toLowerCase().includes(filterCs.toLowerCase().trim());
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q ||
      r.profileName.toLowerCase().includes(q) ||
      r.customerId.toLowerCase().includes(q) ||
      r.contactLink.toLowerCase().includes(q) ||
      r.bankName.toLowerCase().includes(q);
    return matchWebsite && matchShift && matchCs && matchQ;
  });

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
              <span>{viewMode === 'DAILY' ? 'តារាងចុះឈ្មោះប្រចាំថ្ងៃ (Register Daily)' : 'តារាងទិន្នន័យសរុប (Data All)'}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdminUser() ? (
              <>
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="ទាញបញ្ជូនទិន្នន័យទៅ Google Sheet តាមរយៈ Website Security Token"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>ទាញបញ្ជូនទៅ Sheet តាម Token</span>
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
                <span>សិទ្ធិទាញបញ្ជូន Sheet & Export សម្រាប់តែ Admin</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Website Filter */}
          <div>
            <select
              value={filterWebsite}
              onChange={(e) => setFilterWebsite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">គ្រប់ Website ទាំងអស់ (រាប់សរុប {websites.length} វេបសាយ)</option>
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
              placeholder="ស្វែងរកក្នុងតារាង..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">គ្រប់វេនទាំងអស់ (ALL Shifts)</option>
            <option value="វេនព្រឹក">វេនព្រឹក (Morning)</option>
            <option value="វេនយប់">វេនយប់ (Night)</option>
          </select>

          {/* CS ID Filter (Manual Input & Datalist) */}
          <div className="relative">
            <input
              type="text"
              list="cs-filter-options"
              value={filterCs}
              onChange={(e) => setFilterCs(e.target.value)}
              placeholder="វាយបញ្ចូល ឬជ្រើសរើស CS ID (ឧ. ALL, CS-01)..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
            <datalist id="cs-filter-options">
              <option value="ALL">គ្រប់ CS ទាំងអស់ (ALL CS)</option>
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
          សរុប {displayRecords.length} ជួរដេក (Rows)
        </div>
        <div className="font-bold text-emerald-400 text-sm">
          ទឹកប្រាក់សរុប: ${totalDepositSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider sticky top-0 z-10 font-bold border-b border-slate-700">
              <tr>
                <th className="p-3 border-r border-slate-700/50">Serial</th>
                <th className="p-3 border-r border-slate-700/50">Reg Date</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[140px]">Profile Name</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[120px]">Customer ID</th>
                <th className="p-3 border-r border-slate-700/50">Password</th>
                <th className="p-3 border-r border-slate-700/50">Platform</th>
                <th className="p-3 border-r border-slate-700/50">Source</th>
                <th className="p-3 border-r border-slate-700/50">Status</th>
                <th className="p-3 border-r border-slate-700/50">Link / Phone</th>
                <th className="p-3 border-r border-slate-700/50 text-right text-emerald-400">Deposit ($)</th>
                <th className="p-3 border-r border-slate-700/50">Deposit Date</th>
                <th className="p-3 border-r border-slate-700/50">Bank</th>
                <th className="p-3 border-r border-slate-700/50 min-w-[120px]">Account Name</th>
                <th className="p-3 border-r border-slate-700/50">Account No</th>
                <th className="p-3 border-r border-slate-700/50">Shift</th>
                <th className="p-3 border-r border-slate-700/50">CS ID</th>
                <th className="p-3">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {displayRecords.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 border-r border-slate-800/50 font-mono font-bold text-slate-400">#{r.serialNo}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.regDate}</td>
                  <td className="p-3 border-r border-slate-800/50 font-bold text-white whitespace-nowrap">{r.profileName}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-blue-300 whitespace-nowrap">{r.customerId}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-slate-400">{r.password}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.platform}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.sourceName}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      r.status?.includes('Deposit')
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : r.status === 'Come in'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 border-r border-slate-800/50 font-mono text-blue-400 max-w-[140px] truncate">{r.contactLink}</td>
                  <td className="p-3 border-r border-slate-800/50 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                    ${r.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.depositDate}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.bankName}</td>
                  <td className="p-3 border-r border-slate-800/50 uppercase whitespace-nowrap">{r.bankAccountName}</td>
                  <td className="p-3 border-r border-slate-800/50 font-mono whitespace-nowrap">{r.bankAccountNumber}</td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">{r.shift}</td>
                  <td className="p-3 border-r border-slate-800/50 font-semibold text-slate-300">{r.csId}</td>
                  <td className="p-3 font-bold text-amber-400">{r.website}</td>
                </tr>
              ))}

              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan={17} className="p-12 text-center text-slate-500">
                    មិនទាន់មានទិន្នន័យសម្រាប់ {currentWebsite} នៅឡើយទេ
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
                    វេបសាយ: <span className="font-bold text-amber-400">{currentWebsite}</span>
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
                  ទិន្នន័យបានត្រៀមភ្ជាប់បញ្ជូនទៅ Google Sheet ស្វ័យប្រវត្តិ 17 ជួរឈរ (Headers)!
                </p>
                <p className="text-slate-300 leading-relaxed">
                  រាល់ទិន្នន័យដែលបានបញ្ចូលក្នុង <strong>{currentWebsite}</strong> ចំនួន <strong>{displayRecords.length} ជួរ</strong> នឹងត្រូវបញ្ជូនទៅ Google Sheet ដោយស្វ័យប្រវត្តិនូវគ្រប់ Column ទាំង 17៖<br />
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
                រូបមន្ត Google Sheet សម្រាប់ទាញទិន្នន័យមក Sheet ផ្ទាល់:
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
                  <span>{copiedSyncFormula ? 'បានចម្លង!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSyncModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                យល់ព្រម (Done)
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
                    handleSaveWebsite();
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
                onClick={handleSaveWebsite}
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
