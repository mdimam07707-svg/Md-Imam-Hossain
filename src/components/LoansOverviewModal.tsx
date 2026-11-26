import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Coins,
  HandCoins,
  Plus,
  X,
} from 'lucide-react';
import type { Language, Transaction, TxType } from '../types/hisab';
import { money, tr } from '../data/i18n';
import { personGroups } from '../utils/storage';
import { SquircleIcon } from './CategoryIcon';
import { AnimatedNumber, BounceButton, ModalSheet } from './MotionPrimitives';

interface LoansOverviewModalProps {
  open: boolean;
  lang: Language;
  transactions: Transaction[];
  onClose: () => void;
  onAddLoan: (cat: string, ty: TxType) => void;
  onOpenRepay: (person: string) => void;
  onOpenCollect: (person: string) => void;
}

export const LoansOverviewModal: React.FC<LoansOverviewModalProps> = ({
  open,
  lang,
  transactions,
  onClose,
  onAddLoan,
  onOpenRepay,
  onOpenCollect,
}) => {
  const [tab, setTab] = useState<'all' | 'paona' | 'debt'>('all');

  const givenGroups = useMemo(() => personGroups(transactions, 'paona'), [transactions]);
  const takenGroups = useMemo(() => personGroups(transactions, 'debt'), [transactions]);

  const stats = useMemo(() => {
    const totalGiven = givenGroups.reduce((a, g) => a + g.total, 0);
    const totalCollected = givenGroups.reduce((a, g) => a + g.paid, 0);
    const remGiven = Math.max(0, totalGiven - totalCollected);

    const totalTaken = takenGroups.reduce((a, g) => a + g.total, 0);
    const totalRepaid = takenGroups.reduce((a, g) => a + g.paid, 0);
    const remTaken = Math.max(0, totalTaken - totalRepaid);

    return {
      totalGiven,
      totalCollected,
      remGiven,
      totalTaken,
      totalRepaid,
      remTaken,
      net: remGiven - remTaken,
    };
  }, [givenGroups, takenGroups]);

  return (
    <ModalSheet open={open} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-5 sm:p-6 flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <SquircleIcon name="hand" txType="paona" size="md" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {tr(lang, 'loansOverview')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn'
                  ? 'মোট কত টাকা ঋণ দিয়েছেন ও নিয়েছেন তার সম্পূর্ণ হিসাব'
                  : 'Full breakdown of money lent out and borrowed'}
              </p>
            </div>
          </div>
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-sky-100/80 dark:bg-white/[0.08] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        <div className="overflow-y-auto space-y-4 pr-0.5">
          {/* Two Clear Side-by-Side Totals Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ঋণ দেওয়া (Paona / Given) */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/12 to-sky-500/10 dark:from-violet-500/15 dark:to-purple-900/15 border border-violet-300/60 dark:border-violet-400/25">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {tr(lang, 'loanGivenLabel')}
                </span>
                <BounceButton
                  onClick={() => {
                    onClose();
                    onAddLoan('পাওনা', 'paona');
                  }}
                  className="px-2 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'দিন' : 'Add'}</span>
                </BounceButton>
              </div>
              <p className="text-2xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                <AnimatedNumber value={stats.totalGiven} formatter={(n) => money(n, lang)} />
              </p>
              <div className="mt-2 pt-2 border-t border-violet-200/70 dark:border-white/10 flex justify-between text-[11px] tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {tr(lang, 'collected')}: {money(stats.totalCollected, lang)}
                </span>
                <span className="text-violet-700 dark:text-violet-300 font-bold">
                  {tr(lang, 'remaining')}: {money(stats.remGiven, lang)}
                </span>
              </div>
            </div>

            {/* ঋণ নেওয়া (Debt / Taken) */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/12 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-900/15 border border-amber-300/60 dark:border-amber-400/25">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  {tr(lang, 'loanTakenLabel')}
                </span>
                <BounceButton
                  onClick={() => {
                    onClose();
                    onAddLoan('ঋণ নেওয়া', 'debt');
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'নিন' : 'Add'}</span>
                </BounceButton>
              </div>
              <p className="text-2xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                <AnimatedNumber value={stats.totalTaken} formatter={(n) => money(n, lang)} />
              </p>
              <div className="mt-2 pt-2 border-t border-amber-200/70 dark:border-white/10 flex justify-between text-[11px] tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {tr(lang, 'repaid')}: {money(stats.totalRepaid, lang)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  {tr(lang, 'remaining')}: {money(stats.remTaken, lang)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Loan Position Banner */}
          <div className="rounded-2xl px-4 py-3 bg-sky-50/90 dark:bg-white/[0.04] border border-sky-200/80 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              {tr(lang, 'netLoanLabel')} ({lang === 'bn' ? 'বাকি পাওনা − বাকি দেনা' : 'Due In − Due Out'})
            </span>
            <strong
              className={`text-sm font-extrabold tabular-nums ${
                stats.net >= 0
                  ? 'text-[#1677E8] dark:text-[#C4F135]'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.net >= 0 ? '+' : '−'}
              {money(Math.abs(stats.net), lang)}
            </strong>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-sky-100/70 dark:bg-white/[0.06]">
            {(
              [
                ['all', tr(lang, 'all')],
                ['paona', tr(lang, 'loanGivenLabel')],
                ['debt', tr(lang, 'loanTakenLabel')],
              ] as ['all' | 'paona' | 'debt', string][]
            ).map(([k, label]) => {
              const active = tab === k;
              return (
                <BounceButton
                  key={k}
                  onClick={() => setTab(k)}
                  className={`relative py-2 px-2 rounded-lg text-[11px] font-bold text-center truncate transition-colors ${
                    active
                      ? 'bg-[#1677E8] dark:bg-[#C4F135] text-white dark:text-zinc-950 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span>{label}</span>
                </BounceButton>
              );
            })}
          </div>

          {/* Person-wise Lists */}
          {(tab === 'all' || tab === 'paona') && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                <HandCoins className="w-4 h-4" />
                <span>{tr(lang, 'loanGivenLabel')}</span>
              </div>
              {givenGroups.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-3 text-center rounded-xl bg-sky-50/50 dark:bg-white/[0.02]">
                  {tr(lang, 'noPaona')}
                </p>
              ) : (
                givenGroups.map((g) => {
                  const rem = Math.max(0, g.total - g.paid);
                  const pct = g.total > 0 ? Math.min(100, Math.round((g.paid / g.total) * 100)) : 0;
                  return (
                    <BounceButton
                      key={`given-${g.person}`}
                      onClick={() => {
                        onClose();
                        onOpenCollect(g.person);
                      }}
                      className="w-full p-3 rounded-2xl bg-white/85 dark:bg-white/[0.04] border border-sky-200/70 dark:border-white/10 text-left space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {g.person}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                            {tr(lang, 'total')}: {money(g.total, lang)} · {tr(lang, 'collected')}:{' '}
                            {money(g.paid, lang)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-extrabold text-violet-700 dark:text-violet-300 tabular-nums">
                            {money(rem, lang)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-violet-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </BounceButton>
                  );
                })
              )}
            </div>
          )}

          {(tab === 'all' || tab === 'debt') && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Coins className="w-4 h-4" />
                <span>{tr(lang, 'loanTakenLabel')}</span>
              </div>
              {takenGroups.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 py-3 text-center rounded-xl bg-sky-50/50 dark:bg-white/[0.02]">
                  {tr(lang, 'noLoan')}
                </p>
              ) : (
                takenGroups.map((g) => {
                  const rem = Math.max(0, g.total - g.paid);
                  const pct = g.total > 0 ? Math.min(100, Math.round((g.paid / g.total) * 100)) : 0;
                  return (
                    <BounceButton
                      key={`taken-${g.person}`}
                      onClick={() => {
                        onClose();
                        onOpenRepay(g.person);
                      }}
                      className="w-full p-3 rounded-2xl bg-white/85 dark:bg-white/[0.04] border border-sky-200/70 dark:border-white/10 text-left space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {g.person}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                            {tr(lang, 'total')}: {money(g.total, lang)} · {tr(lang, 'repaid')}:{' '}
                            {money(g.paid, lang)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
                            {money(rem, lang)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-amber-100 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </BounceButton>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </ModalSheet>
  );
};
