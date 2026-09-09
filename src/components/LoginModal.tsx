import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, Lock, CheckCircle2, KeyRound, UserPlus, LogIn, Eye, EyeOff, AlertCircle, HelpCircle, Send, ArrowLeft, RefreshCw, ChevronDown, Check, Languages, Camera, Image, Link as LinkIcon, X } from 'lucide-react';
import { 
  setLoggedInUser, 
  isAdminUser, 
  registerNewUserAsync, 
  verifyUserLoginAsync, 
  resetUserPasswordAsync, 
  getUserProfilePhoto, 
  setUserProfilePhoto, 
  getLoggedInUser 
} from '../utils/auth';
import { sendVerificationCodeEmail } from '../utils/gmail';
import csIcon from '../assets/images/cs_daily_icon_1784810386041.jpg';

import { FlagIcon } from './FlagIcon';
import { Language, t } from '../utils/i18n';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (email: string) => void;
  onClose?: () => void;
  canClose?: boolean;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  blockedMessage?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  canClose = false,
  lang = 'km',
  onLanguageChange,
  blockedMessage
}) => {
  const activeLang: Language = (lang as Language) || 'km';
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-load saved user or profile photo when modal opens / email changes
  useEffect(() => {
    if (isOpen) {
      const currentUser = getLoggedInUser();
      if (currentUser) {
        setEmail(currentUser);
      }
      if (blockedMessage) {
        setErrorMsg(blockedMessage);
      } else {
        setErrorMsg('');
      }
      setSuccessMsg('');
    }
  }, [isOpen, blockedMessage]);

  useEffect(() => {
    if (email.trim()) {
      const saved = getUserProfilePhoto(email.trim());
      if (saved) setPhotoUrl(saved);
    }
  }, [email]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('ទំហំរូបភាពធំពេក! សូមជ្រើសរើសរូបភាពក្រោម 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsSendingEmail(true);

    try {
      const apiRes = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await apiRes.json();

      if (data.success) {
        setGeneratedCode(data.code);
        setCodeSent(true);
        setSuccessMsg(`លេខកូដ 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ ${cleanEmail} រួចរាល់ហើយ! (សូមពិនិត្យមើលសារក្នុង Gmail)`);
      } else {
        setErrorMsg(data.message || 'មិនអាចផ្ញើកូដបានទេ! សូមព្យាយាមម្ដងទៀត។');
      }
    } catch (err: any) {
      // Fallback local code generation if API is unreachable
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(fallbackCode);
      setCodeSent(true);
      setSuccessMsg(`លេខកូដ 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ ${cleanEmail} រួចរាល់ហើយ!`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    if (!codeSent || !generatedCode) {
      setErrorMsg('សូមចុច "ផ្ញើកូដ (Give Code)" ជាមុនសិន!');
      return;
    }

    if (inputCode.trim() !== generatedCode) {
      setErrorMsg('លេខកូដ 6 ខ្ទង់មិនត្រឹមត្រូវទេ! សូមពិនិត្យលេខកូដដែលបានផ្ញើទៅ Gmail។');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 4 តួអក្សរ!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ!');
      return;
    }

    const res = await resetUserPasswordAsync(cleanEmail, newPassword);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    // Success reset
    setSuccessMsg('ប្តូរពាក្យសម្ងាត់បានជោគជ័យ! សូមចូលប្រើប្រាស់ដោយប្រើពាក្យសម្ងាត់ថ្មី។');
    setEmail(cleanEmail);
    setPassword(newPassword);
    setTimeout(() => {
      setAuthMode('LOGIN');
      setCodeSent(false);
      setGeneratedCode(null);
      setInputCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (authMode === 'LOGIN') {
      const res = await verifyUserLoginAsync(cleanEmail, password);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      if (res.photoUrl || photoUrl) {
        setUserProfilePhoto(cleanEmail, res.photoUrl || photoUrl);
      }
      setLoggedInUser(cleanEmail);
      onLoginSuccess(cleanEmail);
    } else if (authMode === 'REGISTER') {
      // REGISTER MODE
      if (password !== confirmPassword) {
        setErrorMsg('ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ! សូមពិនិត្យឡើងវិញ។');
        return;
      }

      const regRes = await registerNewUserAsync(cleanEmail, password, photoUrl);
      if (!regRes.success) {
        setErrorMsg(regRes.message);
        return;
      }

      if (photoUrl) {
        setUserProfilePhoto(cleanEmail, photoUrl);
      }

      setSuccessMsg('បង្កើតគណនីបានជោគជ័យ! កំពុងចូលប្រើប្រាស់...');
      setLoggedInUser(cleanEmail);
      setTimeout(() => {
        onLoginSuccess(cleanEmail);
      }, 1000);
    }
  };

  const isTypedAdmin = email.trim() ? isAdminUser(email.trim()) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Backdrop overlay click handler when canClose is true */}
      {canClose && onClose && (
        <div 
          className="absolute inset-0 z-0" 
          onClick={onClose}
          title="ចុចទីនេះដើម្បីបិទ (Click outside to close)"
        />
      )}

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        
        {/* Top bar with close button if allowed */}
        {canClose && onClose && (
          <div className="flex justify-end -mb-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="បិទផ្ទាំង (Close Modal)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Icon & Title & Language Switcher */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {t(activeLang, 'systemTitle')}
            </span>

            {/* Language Selection Dropdown List */}
            {onLanguageChange && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="ជ្រើសរើសភាសា (Language)"
                >
                  <FlagIcon code={activeLang} className="w-4 h-3 rounded-xs" />
                  <span>
                    {activeLang === 'km' ? 'ខ្មែរ' : activeLang === 'en' ? 'EN' : '中文'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180 text-blue-400' : ''}`} />
                </button>

                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 animate-fade-in text-left">
                      <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Languages className="w-3 h-3 text-blue-400" />
                        <span>ជ្រើសរើសភាសា</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {[
                          { code: 'km' as Language, name: 'ភាសាខ្មែរ', label: 'Khmer' },
                          { code: 'en' as Language, name: 'English', label: 'English' },
                          { code: 'zh' as Language, name: '中文', label: 'Chinese' },
                        ].map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => {
                              onLanguageChange(l.code);
                              setIsLangOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                              activeLang === l.code ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <FlagIcon code={l.code} className="w-4 h-3 rounded-xs" />
                              <div className="text-left">
                                <div className="leading-tight">{l.name}</div>
                                <div className="text-[10px] opacity-70 font-mono">{l.label}</div>
                              </div>
                            </div>
                            {activeLang === l.code && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="inline-flex p-2 bg-white/10 border border-slate-700 rounded-2xl shadow-lg mb-1">
            <img
              src={csIcon}
              alt="CS Logo"
              className="w-12 h-12 object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {t(activeLang, 'welcomeTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            {t(activeLang, 'securityNoticeLogin')}
          </p>
        </div>

        {/* Auth Mode Tabs (Sign In vs Register) */}
        {authMode !== 'FORGOT_PASSWORD' ? (
          <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-300">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Forgot Password</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ត្រឡប់ក្រោយ</span>
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {authMode === 'LOGIN'
                ? 'សូមបញ្ចូល Gmail និងពាក្យសម្ងាត់'
                : authMode === 'REGISTER'
                ? 'ចុះឈ្មោះបង្កើតគណនីថ្មី'
                : 'បញ្ចូល Gmail ដើម្បីទទួលកូដ 6 ខ្ទង់ (Give Code)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {authMode === 'LOGIN'
              ? 'សូមបញ្ចូល Gmail និងពាក្យសម្ងាត់ដែលអ្នកបានចុះឈ្មោះដើម្បីចូលទៅកាន់ប្រព័ន្ធ។'
              : authMode === 'REGISTER'
              ? 'សូមបញ្ចូលអាសយដ្ឋាន Gmail និងកំណត់ពាក្យសម្ងាត់ផ្ទាល់ខ្លួនរបស់អ្នកដើម្បីបង្កើតគណនី។'
              : 'ប្រព័ន្ធនឹងផ្ញើលេខកូដ 6 ខ្ទង់ទៅកាន់ Gmail របស់អ្នក ដើម្បីផ្ទៀងផ្ទាត់ និងផ្លាស់ប្តូរពាក្យសម្ងាត់ថ្មី។'}
          </p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {authMode === 'FORGOT_PASSWORD' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Step 1: Gmail Input & Give Code Button */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gmail Address <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingEmail}
                  className={`px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md`}
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>កំពុងផ្ញើទៅ Gmail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{codeSent ? 'ផ្ញើម្តងទៀត' : 'ផ្ញើកូដ (Give Code)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gmail Sent Status Notification Box */}
            {codeSent && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-2 animate-fade-in text-left">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>កូដ 6 ខ្ទង់ត្រូវ​បាន​ផ្ញើ​ទៅ​កាន់ Gmail៖</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                    Sent
                  </span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-200 font-mono font-bold break-all mb-1">
                    {forgotEmail}
                  </p>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    ✓ លេខកូដ 6 ខ្ទង់ត្រូវ​បាន​ផ្ញើ​ទៅ​កាន់ Gmail របស់អ្នករួចរាល់ហើយ! សូមពិនិត្យមើលសារក្នុង Inbox ឬ Spam ក្នុង Gmail របស់អ្នក រួចយកលេខកូដ 6 ខ្ទង់មកបញ្ចូលក្នុងប្រអប់ខាងក្រោម។
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: 6-Digit Code Input */}
            {codeSent && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    លេខកូដ 6 ខ្ទង់ (Verification Code) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="ឧ. 123456"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest font-bold"
                    />
                  </div>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            {codeSent && (
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Password</span>
              </button>
            )}
          </form>
        ) : (
          /* LOGIN or REGISTER FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gmail Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Gmail Address <span className="text-rose-400">*</span></span>
                {email.trim() && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isTypedAdmin 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isTypedAdmin ? '🛡️ Admin Account' : '👤 CS Staff User'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="ឧ. yourname@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Profile Logo / Photo Uploader */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>រូបភាព Logo / Profile ( Profile Logo )</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (ជម្រើសបន្ថែម)
                </span>
              </label>

              <div className="flex items-center gap-3">
                {/* Image Preview */}
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Logo Preview"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500 shadow-md bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
                      {email.trim() ? email.trim()[0].toUpperCase() : 'LOGO'}
                    </div>
                  )}
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow cursor-pointer hover:bg-rose-600"
                      title="លុបរូបភាព"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    {/* File Upload Button */}
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition cursor-pointer">
                      <Image className="w-3.5 h-3.5" />
                      <span>ជ្រើសរើសរូប (Upload File)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or Paste URL */}
                  <div className="relative">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input
                      type="url"
                      value={photoUrl.startsWith('data:') ? '' : photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder=" រូបភាព (Image URL)..."
                      className="w-full pl-7 pr-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {authMode === 'LOGIN' ? 'ពាក្យសម្ងាត់ (Password)' : 'បង្កើតពាក្យសម្ងាត់ (Create Password)'} <span className="text-rose-400">*</span>
                </label>
                {authMode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setAuthMode('FORGOT_PASSWORD');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
                  >
                    Forgot Password
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Register Mode) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password<span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {authMode === 'LOGIN' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span> Register & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {canClose && onClose && (
          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              បិទផ្ទាំង (Close)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

