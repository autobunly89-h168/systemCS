import React, { useState } from 'react';
import { getSavedWebAppUrl, saveWebAppUrl, syncToGoogleSheetApi, pullFromGoogleSheetApi, loadLocalRecords } from '../utils/gasHelper';
import { getWebsiteToken } from '../data/websites';
import { FileSpreadsheet, Key, Link as LinkIcon, Check, Copy, AlertCircle, RefreshCw, Send, ShieldCheck, Sparkles, X, Info, Download } from 'lucide-react';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWebsite: string;
}

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  currentWebsite
}) => {
  const [webAppUrl, setWebAppUrl] = useState<string>(() => getSavedWebAppUrl() || 'https://script.google.com/macros/s/AKfycbwHfrp9r-HmJVAM_ZSF1wfrOXi-xnN7aCOjLpx3Q_l_rzzlwu9sB8PgDlfHA9hbkbAW/exec');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);

  if (!isOpen) return null;

  const token = getWebsiteToken(currentWebsite);
  const formulaStr = `=FETCH_WEBSITE_DATA("${currentWebsite}", "${token}")`;
  const allRecords = loadLocalRecords();
  const websiteRecords = allRecords.filter(r => !r.website || r.website === currentWebsite);

  const handleSaveUrl = (url: string) => {
    setWebAppUrl(url);
    saveWebAppUrl(url);
  };

  const handleSyncNow = async () => {
    if (!webAppUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'សូមបញ្ចូល Google Apps Script Web App URL ជាមុនសិន!'
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    saveWebAppUrl(webAppUrl);

    try {
      const res = await syncToGoogleSheetApi(currentWebsite, token, allRecords, webAppUrl);
      setSyncStatus({
        type: res.success ? 'success' : 'error',
        message: res.message || `បានបញ្ជូនទិន្នន័យ ${websiteRecords.length} ជួរទៅ Google Sheet [${currentWebsite}] រួចរាល់!`
      });
    } catch (err) {
      setSyncStatus({
        type: 'error',
        message: 'មានបញ្ហាក្នុងការផ្ញើ Request ទៅកាន់ Google Sheet: ' + String(err)
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullNow = async () => {
    if (!webAppUrl.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'សូមបញ្ចូល Google Apps Script Web App URL ជាមុនសិន!'
      });
      return;
    }

    setIsPulling(true);
    setSyncStatus({ type: null, message: '' });

    saveWebAppUrl(webAppUrl);

    try {
      const res = await pullFromGoogleSheetApi(webAppUrl, currentWebsite);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message || `បានទាញយកទិន្នន័យ ${res.count || 0} ជួរពី Google Sheet / Drive មកវិញរួចរាល់!`
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message || 'ពុំមានទិន្នន័យត្រូវបានទាញយកពី Google Sheet ទេ!'
        });
      }
    } catch (err) {
      setSyncStatus({
        type: 'error',
        message: 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យពី Google Sheet: ' + String(err)
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(formulaStr);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Google Sheet Token Sync</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  {currentWebsite}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                បញ្ជូនទិន្នន័យពីប្រព័ន្ធ CS Daily ទៅកាន់ Google Sheet ស្វ័យប្រវត្តិ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0 touch-pan-y overscroll-contain">
          {/* Active Info Card */}
          <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-emerald-400">⚡ Auto-Save 1s (Google Sheet) កំពុងដំណើរការ</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                1s Real-Time Active
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">វេបសាយកំពុងជ្រើសរើស (Active Website):</span>
              <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                {currentWebsite}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">ចំនួនទិន្នន័យត្រូវ Sync (Total Records):</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {websiteRecords.length} ជួរ (Rows)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
              <span className="text-slate-400 font-medium">Website Security Token:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 tracking-wider">
                  ••••••••••••
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'បានចម្លង!' : 'Copy Token'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Web App URL Form (Method 1) */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4" />
                <span>1. បញ្ចូល Google Apps Script Web App URL (វិធីល្អបំផុត):</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">https://script.google.com/macros/s/.../exec</span>
            </div>

            <input
              type="text"
              value={webAppUrl}
              onChange={(e) => handleSaveUrl(e.target.value)}
              placeholder="Paste Google Web App URL ទីនេះ (ឧ. https://script.google.com/macros/s/AKfycb.../exec)"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handlePullNow}
                disabled={isPulling || isSyncing}
                className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPulling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>កំពុងទាញយកទិន្នន័យ...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>📥 ទាញយកទិន្នន័យពី GOOGLE SHEET</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || isPulling}
                className="py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>កំពុងបញ្ជូនទិន្នន័យ...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>📤 ផ្ញើទិន្នន័យទៅ GOOGLE SHEET</span>
                  </>
                )}
              </button>
            </div>

            {syncStatus.message && (
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {syncStatus.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* Custom Formula Guide (Method 2) */}
          <div className="space-y-2 bg-slate-800/40 border border-slate-800 p-4 rounded-xl text-xs">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" />
                <span>2. ឬប្រើប្រាស់រូបមន្ត Google Sheet Formula:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyFormula}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                {copiedFormula ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormula ? 'បានចម្លង!' : 'Copy Formula'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              {formulaStr}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              💡 <strong>សំគាល់៖</strong> ដើម្បីកុំឲ្យចេញ <code>#ERROR!</code> សូមដាក់រូបមន្តនេះនៅក្នុង Cell ទំនេរ (ឧ. Cell A1) ក្នុង Sheet ថ្មីដែលគ្មាន Data ឬ Header ជាន់គ្នា!
            </p>
          </div>

          {/* Setup Guide */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200 space-y-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>របៀបដំឡើង Web App URL (ងាយៗ ៣ ជំហាន):</span>
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
              <li>បើក Google Sheet របស់អ្នក ➡️ ចុច <strong>Extensions</strong> ➡️ <strong>Apps Script</strong> ➡️ Paste កូដ <code>Code.gs</code> ចូល។</li>
              <li>ចុច <strong>Deploy</strong> ➡️ <strong>New deployment</strong> ➡️ ជ្រើសរើស <strong>Web App</strong> (Execute as: <strong>Me</strong>, Who has access: <strong>Anyone</strong>)។</li>
              <li>ចុច <strong>Deploy</strong> ➡️ Copy យក Web App URL មកដាក់ក្នុងប្រអប់ខាងលើ ➡️ រួចចុច <strong>Sync All Data</strong> ជាការស្រេច!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
