import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Coins, HandCoins } from 'lucide-react';
import type { Language, PeriodSummary } from '../types/hisab';
import { fmtNum, money, tr } from '../data/i18n';
import { AnimatedNumber } from './MotionPrimitives';

interface RadialSummaryOrbProps {
  summary: PeriodSummary;
  periodLabel: string;
  lang: Language;
  isDark?: boolean;
}

export const RadialSummaryOrb: React.FC<RadialSummaryOrbProps> = ({
  summary,
  periodLabel,
  lang,
  isDark = true,
}) => {
  const net = summary.income - summary.expense;
  const remainingDebt = Math.max(0, summary.debt - summary.repaid);
  const remainingPaona = Math.max(0, summary.paona - summary.collected);
  const totalVolume =
    summary.income + summary.expense + remainingDebt + remainingPaona;

  const segments = [
    {
      label: tr(lang, 'income'),
      value: summary.income,
      color: isDark ? '#C4F135' : '#1677E8',
      textColor: 'text-[#1677E8] dark:text-[#C4F135]',
    },
    {
      label: tr(lang, 'expense'),
      value: summary.expense,
      color: '#FB7185',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: `${tr(lang, 'loanTaken')} (${tr(lang, 'remaining')})`,
      value: remainingDebt,
      color: '#FBBF24',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: `${tr(lang, 'given')} (${tr(lang, 'remaining')})`,
      value: remainingPaona,
      color: '#A78BFA',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  const R = 48;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;

  return (
    <section
      className="relative overflow-hidden rounded-[28px] p-5 sm:p-6 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm"
    >
      {/* Atmospheric bloom inside card: Sky Blue in Light Mode, Lime Green in Dark Mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 w-52 h-52 rounded-full bg-sky-300/35 dark:bg-[#B8F227]/22 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-8 w-44 h-44 rounded-full bg-blue-200/35 dark:bg-[#9BE018]/15 blur-3xl"
      />

      {/* Header Row */}
      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {tr(lang, 'sixSum')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {periodLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            {tr(lang, 'balanceL')}
          </p>
          <p className="text-base font-extrabold text-[#1677E8] dark:text-[#C4F135] tabular-nums">
            <AnimatedNumber value={summary.balance} formatter={(n) => money(n, lang)} />
          </p>
        </div>
      </div>

      {/* Overlapping 3-Lobe Glassmorphic Venn Orb */}
      <div className="relative grid grid-cols-1 sm:grid-cols-[206px_1fr] gap-5 items-center">
        <div className="relative mx-auto w-[198px] h-[192px] flex items-center justify-center">
          {/* Top-left translucent glass lobe */}
          <div className="pointer-events-none absolute top-1 left-1 w-28 h-28 rounded-full bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-sky-200/80 dark:border-white/15 shadow-inner" />
          {/* Top-right translucent glass lobe */}
          <div className="pointer-events-none absolute top-1 right-1 w-28 h-28 rounded-full bg-sky-200/45 dark:bg-[#C4F135]/[0.06] backdrop-blur-md border border-sky-300/60 dark:border-[#C4F135]/20 shadow-inner" />
          {/* Bottom translucent glass lobe */}
          <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-white/55 dark:bg-white/[0.03] backdrop-blur-md border border-sky-200/80 dark:border-white/12 shadow-inner" />

          {/* Central luminous ring core */}
          <div className="relative z-10 w-[132px] h-[132px] rounded-full bg-white/85 dark:bg-[#0D1015]/85 backdrop-blur-xl border border-sky-200 dark:border-white/20 shadow-xl flex items-center justify-center">
            <svg viewBox="0 0 124 124" className="w-[126px] h-[126px] -rotate-90">
              <circle
                cx="62"
                cy="62"
                r={R}
                fill="none"
                className="stroke-sky-100 dark:stroke-white/10"
                strokeWidth="9"
              />
              {totalVolume > 0 &&
                segments.map((seg) => {
                  if (seg.value <= 0) return null;
                  const segLen = (seg.value / totalVolume) * CIRC;
                  const currentOffset = offset;
                  offset += segLen;
                  return (
                    <circle
                      key={seg.label}
                      cx="62"
                      cy="62"
                      r={R}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(4, segLen - 3)} ${CIRC}`}
                      strokeDashoffset={-currentOffset}
                      className="transition-all duration-500 ease-out"
                    />
                  );
                })}
            </svg>

            {/* Center Net Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                {tr(lang, 'income')} − {tr(lang, 'expense')}
              </span>
              <span
                className={`text-base font-extrabold tracking-tight tabular-nums mt-0.5 ${
                  net >= 0
                    ? 'text-slate-950 dark:text-white'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {net >= 0 ? '' : '−'}৳ {fmtNum(Math.abs(net), lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Rows */}
        <div className="space-y-2">
          {segments.map((seg, idx) => {
            const pct = totalVolume > 0 ? Math.round((seg.value / totalVolume) * 100) : 0;
            const Icons = [ArrowDownLeft, ArrowUpRight, Coins, HandCoins];
            const Icon = Icons[idx];
            return (
              <div
                key={seg.label}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-sky-200/60 dark:border-white/[0.08] last:border-b-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-white/[0.07] ${seg.textColor} shrink-0`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {seg.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                      {fmtNum(pct, lang)}%
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-bold tabular-nums shrink-0 ${seg.textColor}`}>
                  {money(seg.value, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
