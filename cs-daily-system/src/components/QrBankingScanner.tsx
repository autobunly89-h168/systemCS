import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Upload, CheckCircle2, AlertCircle, Trash2, Copy, Sparkles, Image as ImageIcon } from 'lucide-react';
import { decodeQrFromImageSrc, KhqrParseResult } from '../utils/khqrParser';

interface QrBankingScannerProps {
  onScanSuccess: (data: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    amount?: string;
  }) => void;
  onClear?: () => void;
  className?: string;
}

export const QrBankingScanner: React.FC<QrBankingScannerProps> = ({
  onScanSuccess,
  onClear,
  className = ''
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<KhqrParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('សូមជ្រើសរើសឯកសាររូបភាព (PNG, JPG, WEBP...)');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    await processImageSrc(objectUrl);
  };

  const processImageSrc = async (src: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanResult(null);

    try {
      const result = await decodeQrFromImageSrc(src);
      if (result.success) {
        setScanResult(result);
        // Automatically populate the form fields
        onScanSuccess({
          bankName: result.bankName || '',
          accountName: result.accountName || '',
          accountNumber: result.accountNumber || '',
          amount: result.amount
        });
      } else {
        setErrorMessage(result.error || 'មិនអាចអាន QR Code នេះបានទេ! សូមព្យាយាមប្រើរូបភាពច្បាស់ជាងនេះ។');
      }
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការស្គេនរូបភាព QR: ' + String(err));
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processImageFile(file);
    }
  };

  // Handle Clipboard Paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only process paste if this component is in view
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            return;
          }
        }
      }

      // If text paste starts with data:image or http image
      const text = e.clipboardData.getData('text');
      if (text && (text.startsWith('data:image/') || text.startsWith('http'))) {
        e.preventDefault();
        setImageSrc(text);
        processImageSrc(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleClear = () => {
    setImageSrc(null);
    setScanResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div
      ref={containerRef}
      id="qr-banking-scanner-card"
      className={`bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 ${
        isDragOver
          ? 'border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-500/40'
          : scanResult
          ? 'border-emerald-500/50 shadow-md shadow-emerald-950/30'
          : errorMessage
          ? 'border-rose-500/40'
          : 'border-slate-800 hover:border-slate-700'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg text-white shadow-sm">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>ស្គេន QR ធនាគារ (KHQR Banking Scanner)</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                Auto-Fill
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              ចុច Upload, អូសទម្លាក់ (Drag) ឬ ចុច <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono">Ctrl + V</kbd> ដើម្បី Paste រូប QR
            </p>
          </div>
        </div>

        {imageSrc && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
            title="លុបព័ត៌មាន QR"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processImageFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Upload Dropzone / Result View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Drop Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`md:col-span-5 relative flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            isDragOver
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : imageSrc
              ? 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
              : 'border-slate-700/80 bg-slate-800/40 hover:border-purple-400/60 hover:bg-slate-800/70'
          }`}
          style={{ minHeight: '130px' }}
        >
          {imageSrc ? (
            <div className="relative w-full h-28 flex items-center justify-center">
              <img
                src={imageSrc}
                alt="Uploaded QR"
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition rounded-lg flex items-center justify-center text-white text-xs font-semibold backdrop-blur-xs">
                ចុចដើម្បីប្តូររូបថ្មី
              </div>
            </div>
          ) : (
            <div className="text-center py-2 px-3">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200">
                ចុច Upload ឬ <span className="text-purple-400 font-bold">Paste (Ctrl+V)</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                គាំទ្រ KHQR របស់គ្រប់ធនាគារ (ABA, ACLEDA, Wing...)
              </p>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-emerald-300">កំពុងស្គេនទិន្នន័យ...</span>
            </div>
          )}
        </div>

        {/* Scan Result Data Card */}
        <div className="md:col-span-7">
          {scanResult ? (
            <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ស្គេនជោគជ័យ! បញ្ចូលទិន្នន័យស្វ័យប្រវត្តិ</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onScanSuccess({
                      bankName: scanResult.bankName || '',
                      accountName: scanResult.accountName || '',
                      accountNumber: scanResult.accountNumber || '',
                      amount: scanResult.amount
                    });
                  }}
                  className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-0.5 rounded border border-emerald-500/30 transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>បញ្ចូលម្តងទៀត</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Bank Name */}
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block font-medium">ធនាគារ (Bank Name)</span>
                  <span className="text-emerald-400 font-bold truncate block">
                    {scanResult.bankName || '—'}
                  </span>
                </div>

                {/* Account Name */}
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block font-medium">ឈ្មោះគណនី (Name)</span>
                  <span className="text-white font-bold truncate uppercase block">
                    {scanResult.accountName || '—'}
                  </span>
                </div>

                {/* Account Number */}
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block font-medium">លេខគណនី (Account Number)</span>
                  <span className="text-amber-400 font-mono font-bold tracking-wider block">
                    {scanResult.accountNumber || '—'}
                  </span>
                </div>

                {/* Amount if present */}
                {scanResult.amount && (
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 sm:col-span-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">ចំនួនទឹកប្រាក់ (Amount in QR)</span>
                    <span className="text-emerald-400 font-extrabold font-mono">
                      ${Number(scanResult.amount).toFixed(2)} {scanResult.currency || ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : errorMessage ? (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs">
              <div className="flex items-start gap-2 text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-200">{errorMessage}</p>
                  <p className="text-[11px] text-rose-300/80 mt-1">
                    សូមប្រាកដថារូបភាព QR ច្បាស់ មិនបែក និងជា KHQR របស់ធនាគារនៅកម្ពុជា។
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center text-xs text-slate-400 bg-slate-800/30 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-1.5 text-slate-300 font-semibold">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>ស្គេនបានដោយស្វ័យប្រវត្តិ៖</span>
              </div>
              <ul className="text-[11px] space-y-1 text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-300">ឈ្មោះធនាគារ</strong> (ABA, ACLEDA, Wing, Canadia...)</li>
                <li><strong className="text-slate-300">ឈ្មោះគណនី</strong> (Account Merchant Name)</li>
                <li><strong className="text-slate-300">លេខគណនី</strong> (Account ID / Number)</li>
                <li><strong className="text-slate-300">ប្រាក់បញ្ញើ</strong> (ប្រសិនបើមានក្នុង QR)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
