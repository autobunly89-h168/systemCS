import React, { useState } from 'react';
import { getAllWebsites, addCustomWebsite, getWebsiteToken, PLATFORM_OPTIONS } from '../data/websites';
import { WebsiteInfo, CustomerRecord } from '../types';
import { loadLocalRecords, convertDDMMMYYYYToYYYYMMDD, formatDateYYYYMMDD, displayVal, sortRecordsTodayFirst } from '../utils/gasHelper';
import { isAdminUser } from '../utils/auth';
import { Language, t } from '../utils/i18n';
import { BarChart3, Filter, Download, Calendar, Globe, UserCheck, DollarSign, MessageSquareText, FileSpreadsheet, Plus, Lock, X, Key } from 'lucide-react';

interface ReportGeneratorProps {
  currentWebsite: string;
  lang?: Language;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ currentWebsite, lang = 'km' }) => {
  const activeLang: Language = (lang as Language) || 'km';
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterWebsite, setFilterWebsite] = useState<string>(currentWebsite || 'ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('');
  
  const [websites, setWebsites] = useState<WebsiteInfo[]>(() => getAllWebsites());
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteInput, setNewWebsiteInput] = useState('');
  const [showAdminLockNotice, setShowAdminLockNotice] = useState(false);

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

  const allRecords = loadLocalRecords();

  const getRecordISO = (r: CustomerRecord) => {
    if (r.depositDate && /^\d{4}-\d{2}-\d{2}$/.test(r.depositDate.trim())) {
      return r.depositDate.trim();
    }
    if (r.regDate) {
      const iso = convertDDMMMYYYYToYYYYMMDD(r.regDate);
      if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    }
    if (r.timestamp) {
      const tDate = new Date(r.timestamp);
      if (!isNaN(tDate.getTime())) {
        return formatDateYYYYMMDD(tDate);
      }
    }
    return '';
  };

  // Filter records by date range, website, platform, and manual source text
  const filtered = allRecords.filter(r => {
    const matchWeb = filterWebsite === 'ALL' || r.website === filterWebsite;
    const matchPlatform = filterPlatform === 'ALL' || r.platform === filterPlatform;
    const matchSrc = !filterSource.trim() || (r.sourceName || '').toLowerCase().includes(filterSource.trim().toLowerCase());
    
    const isoDate = getRecordISO(r);
    const isAfterStart = !startDate || (isoDate && isoDate >= startDate) || (r.regDate || '').includes(startDate) || (r.depositDate || '').includes(startDate);
    const isBeforeEnd = !endDate || (isoDate && isoDate <= endDate) || (r.regDate || '').includes(endDate) || (r.depositDate || '').includes(endDate);

    const pName = (r.profileName || '').trim();
    const hasValidData = pName !== '' && pName !== '-' && pName.toUpperCase() !== 'N/A';

    return matchWeb && matchPlatform && matchSrc && isAfterStart && isBeforeEnd && hasValidData;
  });

  const sortedFiltered = sortRecordsTodayFirst(filtered);

  const totalRegistered = filtered.filter(r => {
    const cid = (r.customerId || '').trim();
    const isValidCid = cid !== '' && cid !== '-' && cid.toUpperCase() !== 'N/A';
    return r.status === 'New Register' && isValidCid;
  }).length;

  const totalDeposits = filtered.filter(r => (Number(r.depositAmount) || 0) > 0).length;
  const totalAmount = filtered.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
  const totalComIn = filtered.length;

  // Group by Website
  const websiteBreakdown: Record<string, { count: number; depositCount: number; amount: number }> = {};
  filtered.forEach(r => {
    const w = r.website || 'Other';
    if (!websiteBreakdown[w]) {
      websiteBreakdown[w] = { count: 0, depositCount: 0, amount: 0 };
    }
    websiteBreakdown[w].count += 1;
    if (r.depositAmount > 0) websiteBreakdown[w].depositCount += 1;
    websiteBreakdown[w].amount += Number(r.depositAmount) || 0;
  });

  // Export report CSV (summary + detailed records with requested 11 columns)
  const handleExportReport = () => {
    const lines = [
      `CS Daily Management Performance Report`,
      `Date Range: ${startDate} to ${endDate}`,
      `Website Filter: ${filterWebsite}`,
      `Platform Filter: ${filterPlatform}`,
      `Source Filter: ${filterSource || 'ALL'}`,
      ``,
      `SUMMARY METRICS:`,
      `Total ComIn: ${totalComIn}`,
      `Total Registered: ${totalRegistered}`,
      `Total Deposits: ${totalDeposits}`,
      `Total Deposit Amount: $${totalAmount.toFixed(2)}`,
      ``,
      `WEBSITE BREAKDOWN:`,
      `Website,Registered Count,Deposit Count,Total Deposit Amount ($)`
    ];

    Object.entries(websiteBreakdown).forEach(([web, data]) => {
      lines.push(`"${web}",${data.count},${data.depositCount},${data.amount.toFixed(2)}`);
    });

    lines.push(``);
    lines.push(`DETAILED RECORDS (${sortedFiltered.length} entries):`);
    lines.push(`Reg Date,Profile Name,Customer ID,Platform,Source,Status,Deposit ($),Deposit Date,Shift,CS ID,Website`);

    sortedFiltered.forEach(r => {
      lines.push(
        `"${r.regDate || ''}","${r.profileName || ''}","${r.customerId || ''}","${r.platform || ''}","${r.sourceName || ''}","${r.status || ''}",${Number(r.depositAmount) || 0},"${r.depositDate || ''}","${r.shift || ''}","${r.csId || ''}","${r.website || ''}"`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CS_Report_${filterWebsite}_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>{t(activeLang, 'performanceReports')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(activeLang, 'reportFilterDesc')}
            </p>
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t(activeLang, 'exportCsvReport')}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {t(activeLang, 'startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {t(activeLang, 'endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Website Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ជ្រើសរើសវេបសាយ (Website)
            </label>
            <select
              value={filterWebsite}
              onChange={(e) => setFilterWebsite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold"
            >
              <option value="ALL">គ្រប់ Website ទាំងអស់ (រាប់សរុប {websites.length} វេបសាយ)</option>
              {websites.map((w) => (
                <option key={w.name} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ជ្រើសរើសប្រព័ន្ធ (Platform)
            </label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">គ្រប់ប្រព័ន្ធ (ALL PLATFORMS)</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Source Filter (Manual Text Input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ជ្រើសរើសប្រភព (Source)
            </label>
            <input
              type="text"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              placeholder="កំណត់ប្រភពដោយដៃ... (ស្វែងរក)"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase">ComIn</span>
          <div className="text-2xl font-extrabold text-white mt-2">{totalComIn}</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Register</span>
          <div className="text-2xl font-extrabold text-white mt-2">{totalRegistered}</div>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Depositor </span>
          <div className="text-2xl font-extrabold text-white mt-2">{totalDeposits}</div>
        </div>
        <div className="p-5 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl">
          <span className="text-xs font-bold text-emerald-400 uppercase">Total amount</span>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Website Breakdown Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <span>ការបែងចែកតាមវេបសាយ (Website Breakdown)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800 text-slate-300 uppercase font-bold border-b border-slate-700">
              <tr>
                <th className="p-3">ឈ្មោះវេបសាយ (Website)</th>
                <th className="p-3 text-center">ចំនួនចុះឈ្មោះ (Register)</th>
                <th className="p-3 text-center">ចំនួនដាក់ប្រាក់ (Deposits)</th>
                <th className="p-3 text-right">ទឹកប្រាក់សរុប ($ Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {Object.entries(websiteBreakdown).map(([web, data]) => (
                <tr key={web} className="hover:bg-slate-800/50 transition">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>{web}</span>
                  </td>
                  <td className="p-3 text-center font-semibold">{data.count}</td>
                  <td className="p-3 text-center font-semibold">{data.depositCount}</td>
                  <td className="p-3 text-right font-extrabold text-emerald-400">
                    ${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {Object.keys(websiteBreakdown).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    មិនទាន់មានទិន្នន័យក្នុងកំឡុងពេលនេះឡើយ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Records Table for Selected Dates */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>របាយការណ៍ទិន្នន័យលម្អិតតាមកាលបរិច្ឆេទ (Detailed Date Records)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              បង្ហាញទិន្នន័យសរុប <span className="font-bold text-emerald-400">{sortedFiltered.length}</span> ជួរ សម្រាប់កាលបរិច្ឆេទកំណត់ ({startDate} ដល់ {endDate})
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/90 text-slate-300 uppercase font-bold border-b border-slate-700">
              <tr>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Reg Date</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Profile Name</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Customer ID</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Platform</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Source</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Status</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap text-right">Deposit ($)</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Deposit Date</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">Shift</th>
                <th className="p-3 border-r border-slate-700/50 whitespace-nowrap">CS ID</th>
                <th className="p-3 whitespace-nowrap">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {sortedFiltered.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-800/50 transition group">
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap font-medium text-slate-300">
                    {displayVal(r.regDate)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap font-bold text-white">
                    {displayVal(r.profileName)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap font-mono text-blue-300">
                    {displayVal(r.customerId)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap text-slate-300">
                    {displayVal(r.platform)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap text-slate-300">
                    {displayVal(r.sourceName)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      r.status === 'New Register' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      r.status === 'Depositing' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {displayVal(r.status)}
                    </span>
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap text-right font-extrabold text-emerald-400">
                    ${(Number(r.depositAmount) || 0).toFixed(2)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap font-mono text-slate-300">
                    {displayVal(r.depositDate)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap text-slate-300">
                    {displayVal(r.shift)}
                  </td>
                  <td className="p-3 border-r border-slate-800/50 whitespace-nowrap font-mono text-slate-400">
                    {displayVal(r.csId)}
                  </td>
                  <td className="p-3 whitespace-nowrap font-bold text-amber-400">
                    {displayVal(r.website)}
                  </td>
                </tr>
              ))}

              {sortedFiltered.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    ពុំមានទិន្នន័យក្នុងកំឡុងពេលនេះឡើយ (No records found for selected date range)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto touch-pan-y overscroll-contain my-auto">
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
