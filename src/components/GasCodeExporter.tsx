import React, { useState } from 'react';
import { generateGoogleAppsScriptCode } from '../utils/gasHelper';
import { getAllWebsites, getWebsiteToken } from '../data/websites';
import { Code2, Copy, Check, Download, Key, Search, FileCode2, ShieldCheck, Sparkles, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface GasCodeExporterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasCodeExporter: React.FC<GasCodeExporterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'tokens'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTokenItem, setCopiedTokenItem] = useState<string | null>(null);
  const [copiedFormulaItem, setCopiedFormulaItem] = useState<string | null>(null);
  const [searchTokenWeb, setSearchTokenWeb] = useState('');

  const codeGs = generateGoogleAppsScriptCode();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeGs);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeGs], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
  };

  const handleCopyToken = (webName: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenItem(webName);
    setTimeout(() => setCopiedTokenItem(null), 2500);
  };

  const handleCopyFormula = (webName: string, token: string) => {
    const formula = `=FETCH_WEBSITE_DATA("${webName}", "${token}")`;
    navigator.clipboard.writeText(formula);
    setCopiedFormulaItem(webName);
    setTimeout(() => setCopiedFormulaItem(null), 2500);
  };

  const allWebsitesList = getAllWebsites();
  const filteredWebsites = allWebsitesList.filter(w =>
    w.name.toLowerCase().includes(searchTokenWeb.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Google Apps Script & Website Security Tokens
              </h2>
              <p className="text-xs text-slate-400">
                ភ្ជាប់ប្រព័ន្ធ CS Daily ជាមួយ Google Sheet តាមរយៈ Token សុវត្ថិភាពសម្រាប់ {allWebsitesList.length} វេបសាយ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-xs transition cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>កូដ Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-xs transition cursor-pointer ${
              activeTab === 'tokens'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Website Tokens ({allWebsitesList.length} វេបសាយ)</span>
          </button>
        </div>

        {activeTab === 'code' ? (
          <>
            {/* Instructions */}
            <div className="p-4 bg-slate-800/40 border-b border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>របៀបយកកូដទៅប្រើប្រាស់ក្នុង Google Sheets:</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>គាំទ្រ៖ បញ្ចូលទម្លាក់តាម Row មួយៗ & លុបជួរ Row ស្វ័យប្រវត្តិ</span>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>បើក Google Sheet របស់អ្នក ➡️ ចុចលើ <strong>Extensions</strong> ➡️ ជ្រើសរើស <strong>Apps Script</strong></li>
                <li>លុបកូដចាស់ចោល រួច paste កូដខាងក្រោមនេះចូលទៅក្នុង app Script <strong>Code.gs</strong></li>
                <li>ចុច <strong>Deploy</strong> ➡️ <strong>New deployment</strong> ➡️ ជ្រើសរើស <strong>Web App</strong> (Who has access: <strong>Anyone</strong>)</li>
                <li>ចុច <strong>Deploy</strong> រួច copy យក Web App URL មកប្រើប្រាស់ជាការស្រេច! (គាំទ្រការបន្ថែម row តាមលំដាប់ និងលុប row ដោយស្វ័យប្រវត្តិ)</li>
              </ol>
            </div>

            {/* Action bar */}
            <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400">Code.gs (JavaScript / Google Apps Script)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'បានចម្លងរួចរាល់!' : 'ចម្លងកូដ (Copy Code)'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Code.gs</span>
                </button>
              </div>
            </div>

            {/* Code View */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-emerald-300/90 leading-relaxed">
              <pre>{codeGs}</pre>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Token Instructions */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Key className="w-4 h-4" />
                <span>របៀបប្រើប្រាស់ Token ដើម្បីទាញទិន្នន័យចូល Google Sheet ស្វ័យប្រវត្តិ:</span>
              </div>
              <p>
                វេបសាយនីមួយៗមាន <strong>Token សុវត្ថិភាពផ្ទាល់ខ្លួន</strong>។ អ្នកអាចប្រើរូបមន្ត <code>=FETCH_WEBSITE_DATA("ឈ្មោះវេបសាយ", "Token")</code> ផ្ទាល់នៅក្នុង Google Sheet ឬប្រើ Web App URL ដើម្បីទាញទិន្នន័យបានយ៉ាងងាយស្រួល!
              </p>
            </div>

            {/* Search Website Tokens */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTokenWeb}
                onChange={(e) => setSearchTokenWeb(e.target.value)}
                placeholder="ស្វែងរក Token តាមឈ្មោះវេបសាយ (ឧ. FAFA191, K9WIN...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Website Tokens Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredWebsites.map((web) => {
                const token = getWebsiteToken(web.name);
                const isCopiedTok = copiedTokenItem === web.name;
                const isCopiedForm = copiedFormulaItem === web.name;

                return (
                  <div
                    key={web.id}
                    className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex flex-col justify-between gap-2.5 hover:border-amber-500/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${web.color}`} />
                        <span className="font-bold text-white text-sm">{web.displayName}</span>
                      </div>
                      <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                        Website ID: {web.name}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-amber-400 font-bold tracking-wider truncate">
                        {token}
                      </span>
                      <button
                        onClick={() => handleCopyToken(web.name, token)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold transition shrink-0 cursor-pointer"
                      >
                        {isCopiedTok ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopiedTok ? 'បានចម្លង!' : 'Copy Token'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        =FETCH_WEBSITE_DATA("{web.name}", "{token}")
                      </span>
                      <button
                        onClick={() => handleCopyFormula(web.name, token)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-medium transition shrink-0 cursor-pointer"
                      >
                        {isCopiedForm ? <Check className="w-3 h-3 text-emerald-400" /> : <FileSpreadsheet className="w-3 h-3 text-emerald-400" />}
                        <span>{isCopiedForm ? 'បានចម្លង!' : 'Copy Formula'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

