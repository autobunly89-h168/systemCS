import React, { useState, useEffect } from 'react';
import { CustomerRecord } from '../types';
import { searchCustomerLocal, saveOrReplaceCustomerRecordLocal, deleteCustomerRecordLocal, formatDateDDMMMYYYY, formatDateYYYYMMDD, fetchSharedRecordsAsync } from '../utils/gasHelper';
import { BANK_OPTIONS, CS_ID_LIST } from '../data/websites';
import { Language, t } from '../utils/i18n';
import { Search, UserCheck, DollarSign, CreditCard, Building2, ExternalLink, Globe, Layers, PlusCircle, Key, RefreshCw, X, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';

interface CustomerSearchProps {
  currentWebsite: string;
  lang?: Language;
  onQuickDepositClick: (record: CustomerRecord) => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  currentWebsite,
  lang = 'km',
  onQuickDepositClick
}) => {
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const [results, setResults] = useState<{ records: CustomerRecord[]; totalDeposit: number }>({ records: [], totalDeposit: 0 });

  // Modal States
  const [addIdRecord, setAddIdRecord] = useState<CustomerRecord | null>(null);
  const [addDepositRecord, setAddDepositRecord] = useState<CustomerRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<CustomerRecord | null>(null);

  // Form Fields for Add ID Modal
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addIdDepositAmount, setAddIdDepositAmount] = useState('0.00');
  const [addIdDepositDate, setAddIdDepositDate] = useState(formatDateYYYYMMDD(new Date()));
  const [addIdBankName, setAddIdBankName] = useState('ABA Bank');
  const [addIdBankAccountName, setAddIdBankAccountName] = useState('');
  const [addIdBankAccountNumber, setAddIdBankAccountNumber] = useState('');
  const [addIdCsId, setAddIdCsId] = useState('CS-01');

  // Form Fields for Add Deposit Modal
  const [depositAmount, setDepositAmount] = useState('0.00');
  const [bankName, setBankName] = useState('ABA Bank');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Alert State
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const todayStr = formatDateDDMMMYYYY(new Date());
  const todayISO = formatDateYYYYMMDD(new Date());

  const refreshSearch = async () => {
    await fetchSharedRecordsAsync();
    const activeWeb = searchScope === 'CURRENT' ? currentWebsite : 'ALL';
    if (query.trim().length >= 1) {
      const res = searchCustomerLocal(query, activeWeb);
      setResults(res);
    } else {
      setResults({ records: [], totalDeposit: 0 });
    }
  };

  useEffect(() => {
    refreshSearch();
  }, [query, searchScope, currentWebsite]);

  // Open Add ID Modal
  const handleOpenAddIdModal = (rec: CustomerRecord) => {
    setAddIdRecord(rec);
    setNewCustomerId(rec.customerId !== 'N/A' ? rec.customerId : '');
    setNewPassword(rec.password !== 'N/A' ? (rec.password || '') : '');
    setAddIdDepositAmount(rec.depositAmount > 0 ? rec.depositAmount.toString() : '0.00');
    setAddIdDepositDate(rec.depositDate || todayISO);
    setAddIdBankName(rec.bankName || 'ABA Bank');
    setAddIdBankAccountName(rec.bankAccountName !== 'N/A' ? (rec.bankAccountName || '') : '');
    setAddIdBankAccountNumber(rec.bankAccountNumber !== 'N/A' ? (rec.bankAccountNumber || '') : '');
    setAddIdCsId(rec.csId || 'CS-01');
  };

  // Open Add Deposit Modal
  const handleOpenAddDepositModal = (rec: CustomerRecord) => {
    setAddDepositRecord(rec);
    setDepositAmount('0.00');
    setBankName(rec.bankName || 'ABA Bank');
    setBankAccountName(rec.bankAccountName !== 'N/A' ? (rec.bankAccountName || '') : '');
    setBankAccountNumber(rec.bankAccountNumber !== 'N/A' ? (rec.bankAccountNumber || '') : '');
  };

  // Auto Generate Password helper
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = 'Pass';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // Handle Submit Add ID New
  const handleAddIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addIdRecord) return;

    if (!newCustomerId.trim()) {
      alert('សូមបញ្ចូលអាយឌីអតិថិជន (Customer ID)');
      return;
    }

    const isTodayRecord = addIdRecord.regDate === todayStr || addIdRecord.depositDate === todayISO;
    const parsedAmt = addIdDepositAmount.trim() !== '' ? (parseFloat(addIdDepositAmount) || 0) : 0;

    saveOrReplaceCustomerRecordLocal(addIdRecord, 'ADD_ID', {
      customerId: newCustomerId.trim(),
      password: newPassword.trim() || 'N/A',
      depositAmount: parsedAmt,
      depositDate: addIdDepositDate || todayISO,
      bankName: addIdBankName,
      bankAccountName: addIdBankAccountName.trim() || 'N/A',
      bankAccountNumber: addIdBankAccountNumber.trim() || 'N/A',
      csId: addIdCsId
    });

    const msg = isTodayRecord
      ? `បានបន្ថែម Customer ID (${newCustomerId}) រួចរាល់! ទិន្នន័យ ComIn ថ្ងៃនេះរបស់ ${addIdRecord.profileName} ត្រូវបានលុបជំនួសដោយទិន្នន័យថ្មីដោយជោគជ័យ។`
      : `បានបង្កើតកំណត់ត្រា ID ថ្មីសម្រាប់ថ្ងៃនេះរួចរាល់! (ទិន្នន័យកាលពីថ្ងៃ ${addIdRecord.regDate} ត្រូវបានរក្សាទុក)`;

    setAlertMessage(msg);
    setAddIdRecord(null);
    refreshSearch();

    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Handle Submit Add Deposit
  const handleAddDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDepositRecord) return;

    const parsedAmt = parseFloat(depositAmount) || 0;
    if (parsedAmt <= 0) {
      alert('សូមបញ្ចូលចំនួនទឹកប្រាក់បញ្ញើដែលត្រឹមត្រូវ');
      return;
    }

    const isTodayRecord = addDepositRecord.regDate === todayStr || addDepositRecord.depositDate === todayISO;

    saveOrReplaceCustomerRecordLocal(addDepositRecord, 'ADD_DEPOSIT', {
      depositAmount: parsedAmt,
      bankName,
      bankAccountName: bankAccountName.trim() || 'N/A',
      bankAccountNumber: bankAccountNumber.trim() || 'N/A'
    });

    const msg = isTodayRecord
      ? `បាន Deposit ថែម $${parsedAmt} រួចរាល់! ទិន្នន័យថ្ងៃនេះរបស់ ${addDepositRecord.profileName} ត្រូវបានលុបជំនួសដោយទិន្នន័យថ្មីដោយជោគជ័យ។`
      : `បានបង្កើតកំណត់ត្រា Deposit ថែម $${parsedAmt} សម្រាប់ថ្ងៃនេះរួចរាល់! (ទិន្នន័យកាលពីថ្ងៃ ${addDepositRecord.regDate} ត្រូវបានរក្សាទុក)`;

    setAlertMessage(msg);
    setAddDepositRecord(null);
    refreshSearch();

    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Handle Delete Record
  const handleConfirmDelete = () => {
    if (!deleteConfirmRecord) return;

    deleteCustomerRecordLocal(deleteConfirmRecord.id);
    setAlertMessage(`បានលុបទិន្នន័យរបស់ ${deleteConfirmRecord.profileName} រួចរាល់ដោយជោគជ័យ!`);
    setDeleteConfirmRecord(null);
    refreshSearch();

    setTimeout(() => setAlertMessage(null), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Alert Banner */}
      {alertMessage && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-bounce-short">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold">{alertMessage}</p>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-xs text-emerald-400 hover:underline">
            បិទ
          </button>
        </div>
      )}

      {/* Search Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              <span>ស្វែងរកព័ត៌មានអតិថិជន (Quick Customer Search)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ស្វែងរកតាម ឈ្មោះប្រូហ្វាល, អាយឌីអតិថិជន (ID), ឬ លេខទូរស័ព្ទ/គណនីធនាគារ
            </p>
          </div>

          {/* Search Scope Filter */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setSearchScope('CURRENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                searchScope === 'CURRENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              វេបសាយ {currentWebsite}
            </button>
            <button
              onClick={() => setSearchScope('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                searchScope === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              គ្រប់ 26 វេបសាយ (ALL)
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="បញ្ចូលឈ្មោះប្រូហ្វាល, ID ឬ លេខទូរស័ព្ទដើម្បីស្វែងរក..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Overview Bar */}
      {query && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>រកឃើញ <strong className="text-white">{results.records.length}</strong> ប្រតិបត្តិការ</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm">
            សរុបប្រាក់បញ្ញើ: ${results.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-4">
        {results.records.map((rec) => {
          const isTodayRec = rec.regDate === todayStr || rec.depositDate === todayISO;

          return (
            <div
              key={rec.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition shadow-lg space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-md">
                      {rec.website}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                      Serial: #{rec.serialNo}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                      {rec.shift}
                    </span>
                    {isTodayRec ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">
                        ថ្ងៃនេះ (Today)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-md border border-slate-700">
                        {rec.regDate}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {rec.profileName}
                  </h3>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
                  <div className="text-right mr-2">
                    <span className="text-xs text-slate-400 block">ប្រាក់បញ្ញើ</span>
                    <span className="text-xl font-black text-emerald-400">
                      ${rec.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddIdModal(rec)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 whitespace-nowrap cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>ថែម ID ថ្មី (Add ID)</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddDepositModal(rec)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-purple-600/20 whitespace-nowrap cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Deposit ថែម</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmRecord(rec)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer"
                      title="លុបទិន្នន័យនេះ"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>លុប</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">អាយឌីអតិថិជន (ID)</span>
                  <span className="text-slate-200 font-mono font-bold">{rec.customerId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ពាក្យសម្ងាត់ (Password)</span>
                  <span className="text-slate-200 font-mono">{rec.password || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ប្រព័ន្ធ (Platform)</span>
                  <span className="text-slate-200 font-medium">{rec.platform} ({rec.sourceName})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">តំណភ្ជាប់ / Phone</span>
                  <span className="text-blue-400 font-medium truncate block">{rec.contactLink || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ធនាគារ</span>
                  <span className="text-slate-200 font-medium">{rec.bankName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ឈ្មោះគណនី</span>
                  <span className="text-slate-200 font-medium uppercase">{rec.bankAccountName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">លេខគណនី</span>
                  <span className="text-slate-200 font-mono">{rec.bankAccountNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">កាលបរិច្ឆេទ / CS</span>
                  <span className="text-slate-200">{rec.regDate} • {rec.csId}</span>
                </div>
              </div>
            </div>
          );
        })}

        {query && results.records.length === 0 && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            <p className="text-base font-semibold">មិនរកឃើញអតិថិជនឡើយ</p>
            <p className="text-xs mt-1">សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេងទៀត</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Customer ID New */}
      {addIdRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    បន្ថែម ID ថ្មី (Add Customer ID)
                  </h3>
                  <p className="text-xs text-slate-400">
                    វេបសាយ: <span className="font-bold text-blue-400">{addIdRecord.website}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddIdRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Same Day Replacement Rule Alert */}
            {addIdRecord.regDate === todayStr || addIdRecord.depositDate === todayISO ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-300">កំណត់ត្រាថ្ងៃនេះ (Same Day Rule):</strong>
                  កំណត់ត្រា ComIn ឬអតិថិជនថ្ងៃនេះរបស់ <strong>{addIdRecord.profileName}</strong> នឹងត្រូវលុបជំនួសដោយ ID ថ្មីនេះ ដើម្បីការពារកុំឲ្យស្ទួនទិន្នន័យ!
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-300">កំណត់ត្រាថ្ងៃមុន ({addIdRecord.regDate}):</strong>
                  ទិន្នន័យកាលពីថ្ងៃមុននឹងមិនត្រូវលុបទេ! ប្រព័ន្ធនឹងរក្សាទុកប្រវត្តិ និងបង្កើតកំណត់ត្រា ID ថ្មីសម្រាប់ថ្ងៃនេះ។
                </div>
              </div>
            )}

            <form onSubmit={handleAddIdSubmit} className="space-y-4">
              {/* Customer Info (Auto-populated) */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>ព័ត៌មានអត្តសញ្ញាណអតិថិជន (Auto Customer Info)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">ឈ្មោះប្រូហ្វាល (Profile):</span>
                    <strong className="text-white">{addIdRecord.profileName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ប្រព័ន្ធ (Platform):</span>
                    <strong className="text-slate-200">{addIdRecord.platform} ({addIdRecord.sourceName})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">តំណភ្ជាប់/លេខទូរស័ព្ទ:</span>
                    <strong className="text-blue-400">{addIdRecord.contactLink || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">វេបសាយ/CS:</span>
                    <strong className="text-amber-400">{addIdRecord.website} • {addIdRecord.csId}</strong>
                  </div>
                </div>
              </div>

              {/* Input Fields to Add */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    អាយឌីអតិថិជន (Customer ID) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerId}
                    onChange={(e) => setNewCustomerId(e.target.value)}
                    placeholder={`ឧ. ${addIdRecord.website}-1234`}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">
                      ពាក្យសម្ងាត់ (Password)
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      បង្កើត Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="ឧ. Pass8899"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Deposit Amount (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    ចំនួនទឹកប្រាក់ ($ Deposit Amount) <span className="text-slate-400 font-normal">(អាចទុកទទេបាន)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={addIdDepositAmount}
                      onChange={(e) => setAddIdDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Deposit Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    កាលបរិច្ឆេទប្រាក់បញ្ញើ (Deposit Date)
                  </label>
                  <input
                    type="date"
                    value={addIdDepositDate}
                    onChange={(e) => setAddIdDepositDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ឈ្មោះធនាគារ (Bank Name)
                  </label>
                  <select
                    value={addIdBankName}
                    onChange={(e) => setAddIdBankName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {BANK_OPTIONS.map((b) => (
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
                    value={addIdBankAccountName}
                    onChange={(e) => setAddIdBankAccountName(e.target.value)}
                    placeholder="ឧ. SOKHA HONG"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                {/* Bank Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    លេខគណនី (Bank Account Number)
                  </label>
                  <input
                    type="text"
                    value={addIdBankAccountNumber}
                    onChange={(e) => setAddIdBankAccountNumber(e.target.value)}
                    placeholder="ឧ. 000 123 456"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* CS ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    អាយឌី CS (CS ID)
                  </label>
                  <select
                    value={addIdCsId}
                    onChange={(e) => setAddIdCsId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {CS_ID_LIST.map((cs) => (
                      <option key={cs} value={cs}>{cs}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddIdRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>រក្សាទុក ID ថ្មី (Submit & Replace)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Deposit ថែម */}
      {addDepositRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    ទម្រង់ Deposit ថែម (Add Deposit)
                  </h3>
                  <p className="text-xs text-slate-400">
                    វេបសាយ: <span className="font-bold text-purple-400">{addDepositRecord.website}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddDepositRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Same Day Replacement Rule Alert */}
            {addDepositRecord.regDate === todayStr || addDepositRecord.depositDate === todayISO ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-emerald-300">កំណត់ត្រាថ្ងៃនេះ (Same Day Rule):</strong>
                  កំណត់ត្រាថ្ងៃនេះរបស់ <strong>{addDepositRecord.profileName}</strong> នឹងត្រូវលុប/បច្ចុប្បន្នភាពជំនួសដោយទិន្នន័យ Deposit ថែមនេះ ដើម្បីការពារកុំឲ្យស្ទួនទិន្នន័យ!
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-2.5 text-xs text-purple-200">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-purple-300">កំណត់ត្រាថ្ងៃមុន ({addDepositRecord.regDate}):</strong>
                  ទិន្នន័យកាលពីថ្ងៃមុននឹងមិនត្រូវលុបទេ! ប្រព័ន្ធនឹងរក្សាទុកប្រវត្តិ និងបង្កើតកំណត់ត្រា Deposit ថែមថ្មីសម្រាប់ថ្ងៃនេះ។
                </div>
              </div>
            )}

            <form onSubmit={handleAddDepositSubmit} className="space-y-4">
              {/* Customer Info (Auto-populated) */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>ព័ត៌មានអត្តសញ្ញាណអតិថិជន (Auto Customer Info)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">ឈ្មោះប្រូហ្វាល (Profile):</span>
                    <strong className="text-white">{addDepositRecord.profileName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">អាយឌី (Customer ID):</span>
                    <strong className="text-blue-400 font-mono">{addDepositRecord.customerId || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ពាក្យសម្ងាត់ (Password):</span>
                    <strong className="text-slate-200 font-mono">{addDepositRecord.password || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ប្រព័ន្ធ (Platform):</span>
                    <strong className="text-slate-200">{addDepositRecord.platform} ({addDepositRecord.sourceName})</strong>
                  </div>
                </div>
              </div>

              {/* Deposit & Bank Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Deposit Amount */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    ចំនួនទឹកប្រាក់ ($ Deposit Amount) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ឈ្មោះធនាគារ (Bank Name)
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {BANK_OPTIONS.map((b) => (
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
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  />
                </div>

                {/* Bank Account Number */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    លេខគណនី (Bank Account Number)
                  </label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="ឧ. 000 123 456"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddDepositRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>រក្សាទុក Deposit ថែម (Submit & Replace)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    បញ្ជាក់ការលុបទិន្នន័យ (Confirm Delete)
                  </h3>
                  <p className="text-xs text-slate-400">
                    តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ឈ្មោះប្រូហ្វាល:</span>
                <strong className="text-white">{deleteConfirmRecord.profileName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">អាយឌីអតិថិជន:</span>
                <strong className="text-blue-400 font-mono">{deleteConfirmRecord.customerId || 'N/A'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ប្រាក់បញ្ញើ:</span>
                <strong className="text-emerald-400 font-bold">${deleteConfirmRecord.depositAmount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">វេបសាយ / ថ្ងៃ:</span>
                <strong className="text-amber-400">{deleteConfirmRecord.website} • {deleteConfirmRecord.regDate}</strong>
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>ការលុបនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ!</span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>លុបទិន្នន័យ (Confirm Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

