import React, { useState, useRef } from 'react';
import { RefreshCw, Download, Upload, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, Database, HardDrive, Cpu } from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { loadLocalRecords, saveLocalRecords } from '../utils/gasHelper';

interface SystemUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onUpdateComplete?: () => void;
}

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({
  isOpen,
  onClose,
  lang = 'km',
  onUpdateComplete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Safe Update & Reload
  const handlePerformUpdate = () => {
    setIsUpdating(true);
    setUpdateMessage('កំពុងផ្ទៀងផ្ទាត់ និង រក្សាទុកទិន្នន័យក្នុងប្រព័ន្ធ (Checking & Backup Data)...');

    setTimeout(() => {
      try {
        // Ensure all local records are saved firmly
        const records = loadLocalRecords();
        saveLocalRecords(records);

        setUpdateMessage('ទិន្នន័យ ១០០% ត្រូវបានរក្សាទុកយ៉ាងមានសុវត្ថិភាព! កំពុងធ្វើបច្ចុប្បន្នភាព... (100% Data Preserved Safely!)');

        setTimeout(() => {
          setIsUpdating(false);
          if (onUpdateComplete) onUpdateComplete();
          // Reload the page cleanly to fetch the latest version bundle from server
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Update error:', err);
        setIsUpdating(false);
        setUpdateMessage('ការរក្សាទុកទិន្នន័យបរាជ័យ សូមព្យាយាមម្តងទៀត!');
      }
    }, 1000);
  };

  // Handle Export Data Backup JSON
  const handleExportBackup = () => {
    try {
      const allData = {
        app: 'CS_DAILY_SYSTEM',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        records: loadLocalRecords(),
        customPlatforms: JSON.parse(localStorage.getItem('cs_custom_platforms') || '[]'),
        customSources: JSON.parse(localStorage.getItem('cs_custom_sources') || '[]'),
        customBanks: JSON.parse(localStorage.getItem('cs_custom_banks') || '[]'),
        customWebsites: JSON.parse(localStorage.getItem('cs_custom_websites') || '[]'),
        sharedAdmins: JSON.parse(localStorage.getItem('cs_shared_admin_users') || '[]'),
        selectedWebsite: localStorage.getItem('cs_selected_website') || 'K9WIN',
        selectedCsId: localStorage.getItem('cs_selected_id') || 'ALL',
        selectedShift: localStorage.getItem('cs_selected_shift') || 'វេនព្រឹក',
        gasWebAppUrl: localStorage.getItem('cs_gas_web_app_url') || ''
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allData, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `CS_Daily_System_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setImportStatus({
        success: true,
        message: 'បានទាញយក Backup កញ្ចប់ទិន្នន័យ (JSON File) ដោយជោគជ័យ!'
      });
    } catch (e) {
      setImportStatus({
        success: false,
        message: 'បរាជ័យក្នុងការទាញយក Backup សូមព្យាយាមម្តងទៀត!'
      });
    }
  };

  // Handle Import Backup JSON File
  const handleImportBackupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed && Array.isArray(parsed.records)) {
          // Merge imported records with existing records safely
          const existing = loadLocalRecords();
          const existingIds = new Set(existing.map(r => r.id));
          let addedCount = 0;

          const merged = [...existing];
          parsed.records.forEach((rec: any) => {
            if (rec && rec.id && !existingIds.has(rec.id)) {
              merged.push(rec);
              addedCount++;
            }
          });

          saveLocalRecords(merged);

          // Restore custom options if present
          if (Array.isArray(parsed.customPlatforms)) {
            const curP = JSON.parse(localStorage.getItem('cs_custom_platforms') || '[]');
            const newP = Array.from(new Set([...curP, ...parsed.customPlatforms]));
            localStorage.setItem('cs_custom_platforms', JSON.stringify(newP));
          }
          if (Array.isArray(parsed.customSources)) {
            const curS = JSON.parse(localStorage.getItem('cs_custom_sources') || '[]');
            const newS = Array.from(new Set([...curS, ...parsed.customSources]));
            localStorage.setItem('cs_custom_sources', JSON.stringify(newS));
          }
          if (Array.isArray(parsed.customBanks)) {
            const curB = JSON.parse(localStorage.getItem('cs_custom_banks') || '[]');
            const newB = Array.from(new Set([...curB, ...parsed.customBanks]));
            localStorage.setItem('cs_custom_banks', JSON.stringify(newB));
          }

          setImportStatus({
            success: true,
            message: `បញ្ចូល Backup ជោគជ័យ! បន្ថែមទិន្នន័យថ្មីចំនួន ${addedCount} ជួរ (សរុប ${merged.length} ជួរ)`
          });

          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setImportStatus({
            success: false,
            message: 'កញ្ចប់ File Backup JSON មិនត្រឹមត្រូវ!'
          });
        }
      } catch (err) {
        setImportStatus({
          success: false,
          message: 'មិនអាចអាន File Backup នេះបានទេ!'
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-7 text-slate-100 my-auto max-h-[90vh] overflow-y-auto touch-pan-y overscroll-contain">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>ធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ (System Update)</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  v2.5 Stable
                </span>
              </h2>
              <p className="text-xs text-slate-400">រក្សាទុកទិន្នន័យ ១០០% ដោយគ្មានការបាត់បង់</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data Protection Banner */}
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl mb-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-300 mb-0.5">ទិន្នន័យទាំងអស់ត្រូវបានរក្សាទុកយ៉ាងមានសុវត្ថិភាព!</h4>
            <p className="text-slate-300 leading-relaxed">
              រាល់ការចុះឈ្មោះ (New Register), ប្រាក់បញ្ញើ (Deposit), គណនី Admin, Platform និងការកំណត់ផ្សេងៗ
              នឹងត្រូវរក្សាទុកនៅក្នុង LocalStorage & Central Sync ដោយស្វ័យប្រវត្តិ។ ពេលចុច Update ប្រព័ន្ធនឹងរៀបចំទិន្នន័យឡើងវិញដោយគ្មានការបាត់បង់ទិន្នន័យឡើយ!
            </p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-4 mb-6">
          {/* Main Update Button */}
          <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>ធ្វើបច្ចុប្បន្នភាព និង Download ជំនាន់ថ្មី (Update App)</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              ចុចប៊ូតុងនេះដើម្បី Fetch កូដ និងមុខងារថ្មីៗចុងក្រោយបំផុតពី Server ដោយរក្សាទុកទិន្នន័យចាស់ដែលកំពុងប្រើទាំងអស់។
            </p>
            <button
              onClick={handlePerformUpdate}
              disabled={isUpdating}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'កំពុងធ្វើបច្ចុប្បន្នភាព...' : 'ចុចទីនេះដើម្បី Update កម្មវិធី (Update & Refresh)'}</span>
            </button>
            {updateMessage && (
              <p className="mt-2.5 text-xs text-center font-semibold text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{updateMessage}</span>
              </p>
            )}
          </div>

          {/* Backup & Restore Tools */}
          <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>កញ្ចប់ Backup ទិន្នន័យ (Data Backup & Restore)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              អ្នកអាចទាញយក Backup ទិន្នន័យជា JSON File ទុកជាសុវត្ថិភាព ឬបញ្ចូល Backup ត្រឡប់មកវិញបានគ្រប់ពេល។
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>ទាញយក Backup (Export JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>បញ្ចូល Backup (Import JSON)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackupFile}
                className="hidden"
              />
            </div>

            {importStatus && (
              <div className={`mt-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
              }`}>
                {importStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>CS Daily Management System • Auto Preservation Enabled</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
