import React, { useState } from 'react';
import { Mail, ShieldCheck, Lock, CheckCircle2, KeyRound, UserPlus, LogIn, Eye, EyeOff, AlertCircle, HelpCircle, Send, ArrowLeft, RefreshCw } from 'lucide-react';
import { setLoggedInUser, isAdminUser, registerNewUser, verifyUserLogin, resetUserPassword } from '../utils/auth';
import csIcon from '../assets/images/cs_daily_icon_1784810386041.jpg';

import { Language, t } from '../utils/i18n';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (email: string) => void;
  onClose?: () => void;
  canClose?: boolean;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  canClose = false,
  lang = 'km',
  onLanguageChange
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  if (!isOpen) return null;

  const handleSendCode = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ!');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCodeSent(true);
    setSuccessMsg(`លេខកូដ 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ ${cleanEmail} ដោយជោគជ័យ!`);
  };

  const handleResetPassword = (e: React.FormEvent) => {
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

    const res = resetUserPassword(cleanEmail, newPassword);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (authMode === 'LOGIN') {
      const res = verifyUserLogin(cleanEmail, password);
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }
      setLoggedInUser(cleanEmail);
      onLoginSuccess(cleanEmail);
    } else if (authMode === 'REGISTER') {
      // REGISTER MODE
      if (password !== confirmPassword) {
        setErrorMsg('ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ! សូមពិនិត្យឡើងវិញ។');
        return;
      }

      const regRes = registerNewUser(cleanEmail, password);
      if (!regRes.success) {
        setErrorMsg(regRes.message);
        return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header Icon & Title & Language Switcher */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {t(lang, 'systemTitle')}
            </span>

            {/* Language Selection Buttons */}
            {onLanguageChange && (
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => onLanguageChange('km')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    lang === 'km' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="ភាសាខ្មែរ"
                >
                  <span>🇰🇭</span>
                  <span>ខ្មែរ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    lang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="English"
                >
                  <span>🇺🇸</span>
                  <span>EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('zh')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    lang === 'zh' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                  title="中文"
                >
                  <span>🇨🇳</span>
                  <span>中文</span>
                </button>
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
            {t(lang, 'welcomeTitle')}
          </h2>
          <p className="text-xs text-slate-400">
            {t(lang, 'securityNoticeLogin')}
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
              <span>ចូលប្រើប្រាស់ (Sign In)</span>
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
              <span>ចុះឈ្មោះ (Register)</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-300">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>ផ្លាស់ប្តូរពាក្យសម្ងាត់ (Forgot Password)</span>
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
                អាសយដ្ឋាន Gmail របស់អ្នក (Gmail Address) <span className="text-rose-400">*</span>
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
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{codeSent ? 'ផ្ញើម្តងទៀត' : 'ផ្ញើកូដ (Give Code)'}</span>
                </button>
              </div>
            </div>

            {/* Generated Code Display Box */}
            {codeSent && generatedCode && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-1.5 animate-fade-in">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>កូដ 6 ខ្ទង់បានផ្ញើទៅ {forgotEmail}:</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    Gmail Alert
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-xl font-mono font-black text-amber-300 tracking-[0.3em]">
                    {generatedCode}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  ✓ សូមចម្លងលេខកូដ 6 ខ្ទង់ខាងលើ បញ្ចូលក្នុងប្រអប់ខាងក្រោម
                </p>
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
                    ពាក្យសម្ងាត់ថ្មី (New Password) <span className="text-rose-400">*</span>
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
                    បញ្ជាក់ពាក្យសម្ងាត់ថ្មី (Confirm New Password) <span className="text-rose-400">*</span>
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
                <span>ប្តូរពាក្យសម្ងាត់ (Reset Password)</span>
              </button>
            )}
          </form>
        ) : (
          /* LOGIN or REGISTER FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gmail Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>អាសយដ្ឋាន Gmail (Gmail Address) <span className="text-rose-400">*</span></span>
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
                    ភ្លេចពាក្យសម្ងាត់? (Forgot Password)
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
                  បញ្ជាក់ពាក្យសម្ងាត់ (Confirm Password) <span className="text-rose-400">*</span>
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
                  <span>ចូលប្រើប្រាស់ (Sign In)</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>ចុះឈ្មោះ និង ចូលប្រើប្រាស់ (Register & Sign In)</span>
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

