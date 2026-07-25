import React from 'react';
import { DashboardStats } from '../types';
import { Language, t } from '../utils/i18n';
import { UserCheck, DollarSign, MessageSquareText, TrendingUp, Sun, Moon, ArrowUpRight, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';

interface LiveDashboardProps {
  currentWebsite: string;
  activeCsId: string;
  stats: DashboardStats;
  lang?: Language;
  onNavigateToRegister: () => void;
  onNavigateToSearch: () => void;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  currentWebsite,
  activeCsId,
  stats,
  lang = 'km',
  onNavigateToRegister,
  onNavigateToSearch
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Live Dashboard • {currentWebsite}
            </span>
            {activeCsId !== 'ALL' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                CS: {activeCsId}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            ស្ថិតិកិច្ចការប្រចាំថ្ងៃ ({currentWebsite})
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            ទិន្នន័យជាក់ស្ដែងប្រចាំថ្ងៃនេះសម្រាប់វេបសាយ {currentWebsite}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToSearch}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            ស្វែងរកអតិថិជន
          </button>
          <button
            onClick={onNavigateToRegister}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ចុះឈ្មោះថ្មី (Register)</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* ComIn Stat */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ComIn (សាកសួរ)
            </span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <MessageSquareText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalComIn}
            </span>
            <span className="text-xs text-slate-400 ml-2">នាក់</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>ចំនួនសាកសួរអន្តរកម្មសរុប</span>
          </p>
        </div>

        {/* Registered Stat */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ចុះឈ្មោះបាន (Registered)
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalRegistered}
            </span>
            <span className="text-xs text-slate-400 ml-2">អតិថិជន</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>អតិថិជនបានចុះឈ្មោះជោគជ័យ</span>
          </p>
        </div>

        {/* New Deposits Count */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ចំនួនដាក់ប្រាក់ (Deposits)
            </span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalNewDeposits}
            </span>
            <span className="text-xs text-slate-400 ml-2">ប្រតិបត្តិការ</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            ចំនួនដងនៃការដាក់ប្រាក់ថ្ងៃនេះ
          </p>
        </div>

        {/* Total Deposit $ Amount */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 rounded-2xl relative overflow-hidden group shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              សរុបទឹកប្រាក់ ($ Total)
            </span>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400">
              ${stats.totalDepositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-emerald-300/80 mt-2 font-medium">
            សរុបទឹកប្រាក់ប្រកាសថ្ងៃនេះ ({currentWebsite})
          </p>
        </div>
      </div>

      {/* Shift Breakdown & Platform Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Breakdown (2 columns width) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>ការបែងចែកតាមវេន (Shift Analytics - {currentWebsite})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Morning Shift */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">វេនព្រឹក (Morning)</h4>
                    <p className="text-[11px] text-slate-400">10:00 AM - 21:59 PM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/20">
                  {stats.shiftBreakdown.morningCount} នាក់
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">ទឹកប្រាក់សរុប:</span>
                <span className="text-lg font-bold text-amber-400">
                  ${stats.shiftBreakdown.morningAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Night Shift */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">វេនយប់ (Night)</h4>
                    <p className="text-[11px] text-slate-400">22:00 PM - 09:59 AM</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/20">
                  {stats.shiftBreakdown.nightCount} នាក់
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">ទឹកប្រាក់សរុប:</span>
                <span className="text-lg font-bold text-indigo-400">
                  ${stats.shiftBreakdown.nightAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span>តាមប្រព័ន្ធ (Platform Share)</span>
          </h3>

          <div className="space-y-3">
            {Object.keys(stats.platformBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">មិនទាន់មានទិន្នន័យថ្ងៃនេះ</p>
            ) : (
              (Object.entries(stats.platformBreakdown) as [string, { count: number; amount: number }][]).map(([platform, pData]) => {
                const totalAmt = stats.totalDepositAmount || 1;
                const pct = Math.round((pData.amount / totalAmt) * 100);

                return (
                  <div key={platform} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{platform}</span>
                      <span className="text-slate-400 font-mono">
                        {pData.count} នាក់ • ${pData.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
