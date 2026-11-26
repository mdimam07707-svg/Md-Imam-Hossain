import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { Language, Transaction } from '../types/hisab';
import { MONTHS, money, tr } from '../data/i18n';
import { BounceButton } from './MotionPrimitives';

interface TrendSplineChartProps {
  transactions: Transaction[];
  lang: Language;
  isDark?: boolean;
}

interface MonthPoint {
  key: string;
  label: string;
  fullLabel: string;
  inc: number;
  exp: number;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export const TrendSplineChart: React.FC<TrendSplineChartProps> = ({
  transactions,
  lang,
  isDark = true,
}) => {
  const [mode, setMode] = useState<'spline' | 'bar'>('spline');
  const [activeIdx, setActiveIdx] = useState<number>(5);

  const cols: MonthPoint[] = useMemo(() => {
    const now = new Date();
    const list: MonthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key =
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      let inc = 0;
      let exp = 0;
      transactions.forEach((x) => {
        if ((x.date || '').startsWith(key)) {
          if (x.type === 'income') inc += x.amount;
          else if (x.type === 'expense') exp += x.amount;
        }
      });
      const mName = MONTHS[lang][d.getMonth()];
      list.push({
        key,
        label: mName.slice(0, lang === 'bn' ? 4 : 3),
        fullLabel: mName,
        inc,
        exp,
      });
    }
    return list;
  }, [transactions, lang]);

  const maxVal = Math.max(1, ...cols.map((c) => Math.max(c.inc, c.exp)));
  const activeCol = cols[activeIdx] || cols[cols.length - 1];

  const primaryColor = isDark ? '#C4F135' : '#1677E8';

  const W = 320;
  const H = 128;
  const PAD_X = 20;
  const PAD_TOP = 16;
  const PAD_BOT = 16;
  const usableW = W - PAD_X * 2;
  const usableH = H - PAD_TOP - PAD_BOT;

  const incPoints = cols.map((c, i) => ({
    x: PAD_X + (i * usableW) / Math.max(1, cols.length - 1),
    y: PAD_TOP + usableH - (c.inc / maxVal) * usableH,
  }));
  const expPoints = cols.map((c, i) => ({
    x: PAD_X + (i * usableW) / Math.max(1, cols.length - 1),
    y: PAD_TOP + usableH - (c.exp / maxVal) * usableH,
  }));

  const incPath = buildSmoothPath(incPoints);
  const expPath = buildSmoothPath(expPoints);
  const incArea = `${incPath} L ${incPoints[incPoints.length - 1].x} ${H - PAD_BOT} L ${incPoints[0].x} ${H - PAD_BOT} Z`;

  return (
    <section
      className="rounded-[28px] p-5 sm:p-6 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {tr(lang, 'trend')}
          </h3>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              {activeCol?.fullLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1677E8] dark:text-[#C4F135] font-semibold">
              {tr(lang, 'income')}: {money(activeCol?.inc || 0, lang)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {tr(lang, 'expense')}: {money(activeCol?.exp || 0, lang)}
            </span>
          </div>
        </div>

        {/* Segmented Chart Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] shrink-0">
          <BounceButton
            onClick={() => setMode('spline')}
            className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-colors ${
              mode === 'spline'
                ? 'bg-[#1677E8] dark:bg-[#C4F135] text-white dark:text-zinc-950 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{tr(lang, 'splineView')}</span>
          </BounceButton>
          <BounceButton
            onClick={() => setMode('bar')}
            className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap transition-colors ${
              mode === 'bar'
                ? 'bg-[#1677E8] dark:bg-[#C4F135] text-white dark:text-zinc-950 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{tr(lang, 'barView')}</span>
          </BounceButton>
        </div>
      </div>

      {mode === 'spline' ? (
        <div className="relative pt-1">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-36 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="trend-primary-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((ratio) => {
              const y = PAD_TOP + usableH * ratio;
              return (
                <line
                  key={ratio}
                  x1={PAD_X}
                  x2={W - PAD_X}
                  y1={y}
                  y2={y}
                  className="stroke-sky-200/80 dark:stroke-white/[0.06]"
                  strokeDasharray="3 4"
                  strokeWidth="1"
                />
              );
            })}

            {incPoints[activeIdx] && (
              <line
                x1={incPoints[activeIdx].x}
                x2={incPoints[activeIdx].x}
                y1={PAD_TOP}
                y2={H - PAD_BOT}
                className="stroke-sky-300 dark:stroke-white/20"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
            )}

            <path d={incArea} fill="url(#trend-primary-area)" />
            <path
              d={incPath}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.6"
              strokeLinecap="round"
            />

            <path
              d={expPath}
              fill="none"
              stroke="#FB7185"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="4 3"
            />

            {cols.map((c, idx) => {
              const ptI = incPoints[idx];
              const ptE = expPoints[idx];
              const isSelected = idx === activeIdx;
              return (
                <g
                  key={c.key}
                  className="cursor-pointer"
                  onClick={() => setActiveIdx(idx)}
                >
                  <rect
                    x={ptI.x - 20}
                    y={0}
                    width={40}
                    height={H}
                    fill="transparent"
                  />
                  <circle
                    cx={ptE.x}
                    cy={ptE.y}
                    r={isSelected ? 4.5 : 3}
                    fill="#FB7185"
                    className="stroke-white dark:stroke-[#12141A]"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={ptI.x}
                    cy={ptI.y}
                    r={isSelected ? 5.5 : 3.5}
                    fill={primaryColor}
                    className="stroke-white dark:stroke-[#12141A]"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-6 gap-1 mt-1">
            {cols.map((c, idx) => (
              <BounceButton
                key={c.key}
                onClick={() => setActiveIdx(idx)}
                className={`py-1 rounded-lg text-[11px] font-semibold text-center transition-colors ${
                  idx === activeIdx
                    ? 'bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {c.label}
              </BounceButton>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <div className="grid grid-cols-6 gap-2 h-32 items-end px-1">
            {cols.map((c, idx) => {
              const incH = Math.max(4, Math.round((c.inc / maxVal) * 108));
              const expH = Math.max(4, Math.round((c.exp / maxVal) * 108));
              const isSelected = idx === activeIdx;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`flex flex-col items-center justify-end h-full gap-1 cursor-pointer rounded-xl p-1 transition-colors ${
                    isSelected ? 'bg-sky-100/70 dark:bg-white/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-end gap-1 w-full justify-center h-[110px]">
                    <div
                      style={{ height: incH }}
                      className="w-2.5 sm:w-3 rounded-t-md bg-[#1677E8] dark:bg-[#C4F135] transition-all duration-300"
                    />
                    <div
                      style={{ height: expH }}
                      className="w-2.5 sm:w-3 rounded-t-md bg-rose-500 dark:bg-rose-400 transition-all duration-300"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold ${
                      isSelected
                        ? 'text-[#1677E8] dark:text-[#C4F135]'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
