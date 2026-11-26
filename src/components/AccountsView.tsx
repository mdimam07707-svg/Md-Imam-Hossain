import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CloudDownload,
  Image as ImageIcon,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { FilterKey, Language, PeriodKey, Transaction, TxType } from '../types/hisab';
import { QUICK_CATEGORIES, TOTAL_ITEMS, catLabel, findCategoryIcon } from '../data/categories';
import { fmtDate, fmtNum, money, tr } from '../data/i18n';
import {
  nextDue,
  periodRange,
  personGroups,
  sumPay,
  sumPeriod,
  todayIso,
  isoOf,
} from '../utils/storage';
import { SquircleIcon } from './CategoryIcon';
import { AnimatedNumber, BounceButton } from './MotionPrimitives';

interface AccountsViewProps {
  lang: Language;
  transactions: Transaction[];
  monthlyBudget: number;
  reminderDays: number;
  remindersEnabled: { kisti: boolean; paona: boolean; dena: boolean };
  onOpenAdd: (cat?: string, ty?: TxType) => void;
  onOpenCategories: () => void;
  onOpenDetail: (tx: Transaction) => void;
  onOpenRepay: (person: string) => void;
  onOpenCollect: (person: string) => void;
  onOpenLoansOverview: () => void;
  onClearAll: () => void;
  onQuickRestoreDrive?: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  lang,
  transactions,
  monthlyBudget,
  reminderDays,
  remindersEnabled,
  onOpenAdd,
  onOpenCategories,
  onOpenDetail,
  onOpenRepay,
  onOpenCollect,
  onOpenLoansOverview,
  onClearAll,
  onQuickRestoreDrive,
}) => {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let debt = 0;
    let repaid = 0;
    let paona = 0;
    let collected = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
      else if (t.type === 'debt') {
        debt += t.amount;
        repaid += sumPay(t);
      } else if (t.type === 'paona') {
        paona += t.amount;
        collected += sumPay(t);
      }
    });
    return {
      balance: income + debt + collected - expense - paona - repaid,
      income,
      expense,
    };
  }, [transactions]);

  const periodSum = useMemo(() => sumPeriod(transactions, period), [transactions, period]);

  const topCategories = useMemo(() => {
    const [a, b] = periodRange(period);
    const sI = isoOf(a);
    const eI = isoOf(b);
    const m: Record<string, number> = {};
    let tot = 0;
    transactions.forEach((x) => {
      if (x.type === 'expense' && x.date >= sI && x.date <= eI) {
        m[x.category] = (m[x.category] || 0) + x.amount;
        tot += x.amount;
      }
    });
    return {
      tot,
      rows: Object.entries(m)
        .sort((p, q) => q[1] - p[1])
        .slice(0, 5),
    };
  }, [transactions, period]);

  const loanGroups = useMemo(() => personGroups(transactions, 'debt'), [transactions]);
  const paonaGroups = useMemo(() => personGroups(transactions, 'paona'), [transactions]);

  const reminderLines = useMemo(() => {
    const td = new Date(todayIso() + 'T00:00:00');
    const lines: string[] = [];
    const scan = (type: 'debt' | 'paona', on: boolean, prefix: string) => {
      if (!on) return;
      transactions
        .filter((x) => x.type === type && x.amount - sumPay(x) > 0.001)
        .forEach((x) => {
          const d = nextDue(x);
          if (!d) return;
          const days = Math.round((new Date(d + 'T00:00:00').getTime() - td.getTime()) / 864e5);
          if (days > reminderDays) return;
          const per = Math.min(x.amount / (x.months || 1), x.amount - sumPay(x));
          const when =
            days < 0
              ? `${Math.abs(days)}d overdue`
              : days === 0
              ? 'Today'
              : `in ${days}d`;
          lines.push(`${prefix} ${x.person || x.desc}: ${money(per, lang)} (${when} · ${fmtDate(d, lang)})`);
        });
    };
    scan('debt', remindersEnabled.kisti || remindersEnabled.dena, tr(lang, 'loan'));
    scan('paona', remindersEnabled.paona, tr(lang, 'paona'));
    const dr = loanGroups.reduce((a, g) => a + g.total - g.paid, 0);
    if (remindersEnabled.dena && dr > 0) {
      lines.push(`${tr(lang, 'loanTaken')} (${tr(lang, 'remaining')}): ${money(dr, lang)}`);
    }
    return lines;
  }, [transactions, reminderDays, remindersEnabled, loanGroups, lang]);

  const budgetInfo = useMemo(() => {
    if (monthlyBudget <= 0) return null;
    const now = new Date();
    const key = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let spent = 0;
    transactions.forEach((x) => {
      if ((x.date || '').startsWith(key) && x.type === 'expense') spent += x.amount;
    });
    const pct = Math.min(100, Math.round((spent / monthlyBudget) * 100));
    return { spent, pct, over: spent > monthlyBudget };
  }, [transactions, monthlyBudget]);

  const advisorText = useMemo(() => {
    const dr = loanGroups.reduce((a, g) => a + g.total - g.paid, 0);
    const pr = paonaGroups.reduce((a, g) => a + g.total - g.paid, 0);
    const dm = loanGroups.reduce((a, g) => a + g.monthly, 0);
    const pm = paonaGroups.reduce((a, g) => a + g.monthly, 0);
    if (lang === 'bn') {
      const parts: string[] = [];
      if (dr > 0) parts.push(`বাকি ঋণ ${money(dr, lang)} (মাসিক ${money(dm, lang)})`);
      if (pr > 0) parts.push(`আদায় বাকি পাওনা ${money(pr, lang)} (মাসিক ${money(pm, lang)})`);
      return parts.length
        ? `আপনার ${parts.join(' এবং ')}। তালিকায় নামে ট্যাপ করে পরিশোধ বা আদায় করুন।`
        : 'আপনার কোনো বকেয়া ঋণ বা পাওনা নেই। আর্থিক অবস্থা ভারসাম্যপূর্ণ।';
    }
    const parts: string[] = [];
    if (dr > 0) parts.push(`Remaining debt ${money(dr, lang)} (${money(dm, lang)}/mo)`);
    if (pr > 0) parts.push(`Receivables due ${money(pr, lang)} (${money(pm, lang)}/mo)`);
    return parts.length
      ? `${parts.join(' & ')}. Tap any person card to log a payment.`
      : 'No pending loans or receivables. Your ledger is clean.';
  }, [loanGroups, paonaGroups, lang]);

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((x) => (filter === 'all' ? true : x.type === filter))
      .filter(
        (x) =>
          !q ||
          `${x.desc || ''} ${x.person || ''} ${x.category || ''}`
            .toLowerCase()
            .includes(q)
      )
      .slice()
      .sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : (b.ts || 0) - (a.ts || 0)
      );
  }, [transactions, filter, search]);

  const typeStyle = (ty: TxType) => {
    if (ty === 'income') return 'text-emerald-600 dark:text-[#C4F135]';
    if (ty === 'debt') return 'text-amber-600 dark:text-amber-400';
    if (ty === 'paona') return 'text-violet-600 dark:text-violet-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Top Grid: Hero Balance Card + Period Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Signature Focal Anchor Balance Card */}
        <section
          className="lg:col-span-5 relative overflow-hidden rounded-[28px] p-6 bg-gradient-to-br from-[#1677E8] to-[#0C4FA8] text-white dark:from-[#181C24] dark:to-[#0D0F14] border border-sky-300/40 dark:border-white/10 shadow-lg flex flex-col justify-between"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20 dark:bg-[#C4F135]/20 blur-2xl"
          />
          <div className="relative">
            <span className="text-xs font-medium text-sky-100 dark:text-zinc-400">
              {tr(lang, 'balance')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1.5 tabular-nums">
              <AnimatedNumber value={totals.balance} formatter={(n) => money(n, lang)} />
            </h2>
          </div>

          <div className="relative grid grid-cols-2 gap-4 pt-5 mt-6 border-t border-white/20 dark:border-white/10">
            <div>
              <p className="text-xs text-sky-100 dark:text-zinc-400 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300 dark:text-[#C4F135]" />
                <span>{tr(lang, 'income')}</span>
              </p>
              <p className="text-base font-bold text-white dark:text-[#C4F135] mt-0.5 tabular-nums">
                <AnimatedNumber value={totals.income} formatter={(n) => money(n, lang)} />
              </p>
            </div>
            <div>
              <p className="text-xs text-sky-100 dark:text-zinc-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-200 dark:text-rose-400" />
                <span>{tr(lang, 'expense')}</span>
              </p>
              <p className="text-base font-bold text-rose-100 dark:text-rose-400 mt-0.5 tabular-nums">
                <AnimatedNumber value={totals.expense} formatter={(n) => money(n, lang)} />
              </p>
            </div>
          </div>
        </section>

        {/* Period Summary & Top Expense Categories */}
        <section
          className="lg:col-span-7 rounded-[28px] p-5 sm:p-6 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-50">
              {tr(lang, 'summary')}
            </h3>
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-sky-100/80 dark:bg-white/[0.06]">
              {(['month', 'h1', 'h2', 'year'] as PeriodKey[]).map((k) => {
                const label = k === 'month' ? tr(lang, 'thisMonth') : tr(lang, k);
                const active = period === k;
                return (
                  <BounceButton
                    key={k}
                    onClick={() => setPeriod(k)}
                    className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
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
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03]">
              <p className="text-zinc-500 dark:text-zinc-400">{tr(lang, 'income')}</p>
              <p className="font-bold text-lime-600 dark:text-[#C4F135] tabular-nums mt-0.5">
                {money(periodSum.income, lang)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03]">
              <p className="text-zinc-500 dark:text-zinc-400">{tr(lang, 'expense')}</p>
              <p className="font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                {money(periodSum.expense, lang)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03]">
              <p className="text-zinc-500 dark:text-zinc-400">{tr(lang, 'balanceL')}</p>
              <p className="font-bold text-zinc-950 dark:text-white tabular-nums mt-0.5">
                {money(periodSum.balance, lang)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03]">
              <p className="text-zinc-500 dark:text-zinc-400">
                {tr(lang, 'loanTaken')} / {tr(lang, 'repaid')}
              </p>
              <p className="font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                {money(periodSum.debt, lang)} · {money(periodSum.repaid, lang)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] col-span-2 sm:col-span-2">
              <p className="text-zinc-500 dark:text-zinc-400">
                {tr(lang, 'given')} / {tr(lang, 'collected')}
              </p>
              <p className="font-bold text-violet-600 dark:text-violet-400 tabular-nums mt-0.5">
                {money(periodSum.paona, lang)} · {money(periodSum.collected, lang)}
              </p>
            </div>
          </div>

          {topCategories.rows.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/[0.06] space-y-2">
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                {tr(lang, 'expense')} · {tr(lang, 'cat')}
              </p>
              {topCategories.rows.map(([cat, amt]) => {
                const pct = topCategories.tot > 0 ? Math.round((amt / topCategories.tot) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300">{catLabel(cat, lang)}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {money(amt, lang)} · {fmtNum(pct, lang)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] mt-1 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-rose-500 dark:bg-rose-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Reminders + Monthly Budget */}
      {(reminderLines.length > 0 || budgetInfo) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {reminderLines.length > 0 && (
            <section className="rounded-[24px] p-4 sm:p-5 glass-card border border-zinc-200/80 dark:border-white/12 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  {tr(lang, 'stNotif')}
                </h4>
              </div>
              <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                {reminderLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          )}

          {budgetInfo && (
            <section className="rounded-[24px] p-4 sm:p-5 glass-card border border-zinc-200/80 dark:border-white/12 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                  {tr(lang, 'stBudget')}
                </h4>
                <span className="text-xs font-bold text-zinc-900 dark:text-[#C4F135] tabular-nums">
                  {fmtNum(budgetInfo.pct, lang)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] overflow-hidden">
                <div
                  style={{ width: `${budgetInfo.pct}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    budgetInfo.over
                      ? 'bg-rose-500'
                      : budgetInfo.pct > 75
                      ? 'bg-amber-500'
                      : 'bg-lime-500 dark:bg-[#C4F135]'
                  }`}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 tabular-nums">
                {tr(lang, 'expense')}: {money(budgetInfo.spent, lang)} / {money(monthlyBudget, lang)}{' '}
                ·{' '}
                {budgetInfo.over
                  ? 'Over budget'
                  : `${tr(lang, 'remaining')}: ${money(Math.max(0, monthlyBudget - budgetInfo.spent), lang)}`}
              </p>
            </section>
          )}
        </div>
      )}

      {/* Dedicated Button Bar: ঋণ দেওয়া ও ঋণ নেওয়া */}
      <BounceButton
        onClick={onOpenLoansOverview}
        bounceScale={0.985}
        className="w-full rounded-2xl p-3.5 glass-card border border-sky-200/80 dark:border-white/12 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <SquircleIcon name="hand" txType="paona" size="sm" />
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {tr(lang, 'loansOverview')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {lang === 'bn'
                ? 'কত টাকা ঋণ দিয়েছেন ও নিয়েছেন — এক নজরে দেখুন'
                : 'View total loans given & taken side-by-side'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135] shrink-0" />
      </BounceButton>

      {/* Loans & Receivables + Smart Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Loans */}
        <section className="lg:col-span-4 rounded-[28px] p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SquircleIcon name="coins" txType="debt" size="xs" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50">
                {tr(lang, 'loanSec')}
              </h3>
            </div>
            <BounceButton
              onClick={() => onOpenAdd('ঋণ নেওয়া', 'debt')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{tr(lang, 'loan')}</span>
            </BounceButton>
          </div>
          {loanGroups.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">
              {tr(lang, 'noLoan')}
            </p>
          ) : (
            <div className="space-y-2">
              {loanGroups.map((g) => {
                const rem = g.total - g.paid;
                return (
                  <BounceButton
                    key={g.person}
                    onClick={() => onOpenRepay(g.person)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.07] text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {g.person}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
                        {tr(lang, 'monthly')}: {money(g.monthly, lang)} · {tr(lang, 'repaid')}:{' '}
                        {money(g.paid, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          rem > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-lime-600 dark:text-[#C4F135]'
                        }`}
                      >
                        {money(rem, lang)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </BounceButton>
                );
              })}
            </div>
          )}
        </section>

        {/* Receivables */}
        <section className="lg:col-span-4 rounded-[28px] p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SquircleIcon name="hand" txType="paona" size="xs" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-50">
                {tr(lang, 'paonaSec')}
              </h3>
            </div>
            <BounceButton
              onClick={() => onOpenAdd('পাওনা', 'paona')}
              className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[11px] font-bold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>{tr(lang, 'paona')}</span>
            </BounceButton>
          </div>
          {paonaGroups.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">
              {tr(lang, 'noPaona')}
            </p>
          ) : (
            <div className="space-y-2">
              {paonaGroups.map((g) => {
                const rem = g.total - g.paid;
                return (
                  <BounceButton
                    key={g.person}
                    onClick={() => onOpenCollect(g.person)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.07] text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {g.person}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
                        {tr(lang, 'monthly')}: {money(g.monthly, lang)} · {tr(lang, 'collected')}:{' '}
                        {money(g.paid, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-xs font-extrabold tabular-nums ${
                          rem > 0
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-lime-600 dark:text-[#C4F135]'
                        }`}
                      >
                        {money(rem, lang)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </BounceButton>
                );
              })}
            </div>
          )}
        </section>

        {/* Smart Analyzer + Quick Categories Strip */}
        <section className="lg:col-span-4 rounded-[28px] p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135]" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-50">
                {tr(lang, 'advisor')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {advisorText}
            </p>
          </div>

          <div className="pt-3 border-t border-sky-200/70 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                {tr(lang, 'quick')}
              </span>
              <BounceButton
                onClick={onOpenCategories}
                className="text-[11px] font-semibold text-[#1677E8] dark:text-[#C4F135]"
              >
                {fmtNum(TOTAL_ITEMS, lang)}+
              </BounceButton>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK_CATEGORIES.slice(0, 3).map((c) => (
                <BounceButton
                  key={c.name}
                  onClick={() => onOpenAdd(c.name, c.ty)}
                  className="p-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-sky-100 dark:border-white/[0.06] flex flex-col items-center gap-1.5"
                >
                  <SquircleIcon name={c.icon} txType={c.ty} size="xs" />
                  <span className="text-[10px] font-medium truncate w-full text-center text-slate-800 dark:text-zinc-200">
                    {catLabel(c.name, lang)}
                  </span>
                </BounceButton>
              ))}
              <BounceButton
                onClick={onOpenCategories}
                className="p-2 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 flex flex-col items-center justify-center gap-1"
              >
                <Layers className="w-4 h-4" />
                <span className="text-[10px] font-bold">{catLabel('আরও', lang)}</span>
              </BounceButton>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Transactions Section */}
      <section className="rounded-[28px] p-5 sm:p-6 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {tr(lang, 'recent')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {tr(lang, 'tapDetail')}
            </p>
          </div>
          {transactions.length > 0 && (
            <BounceButton
              onClick={onClearAll}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{tr(lang, 'clear')}</span>
            </BounceButton>
          )}
        </div>

        {/* Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1 p-1 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] overflow-x-auto">
            {(
              [
                ['all', tr(lang, 'all')],
                ['income', tr(lang, 'income')],
                ['expense', tr(lang, 'expense')],
                ['debt', tr(lang, 'loan')],
                ['paona', tr(lang, 'paona')],
              ] as [FilterKey, string][]
            ).map(([k, label]) => {
              const active = filter === k;
              return (
                <BounceButton
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
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

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr(lang, 'searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-sky-200 dark:border-white/10 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1677E8] dark:focus:ring-[#B8EE24]"
            />
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {tr(lang, 'empty')}
            </p>
            {transactions.length === 0 && onQuickRestoreDrive && (
              <BounceButton
                onClick={onQuickRestoreDrive}
                className="mx-auto px-4 py-2 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn'
                    ? 'Google Drive থেকে আগের ডাটা ফিরিয়ে আনুন'
                    : 'Restore Previous Data from Google Drive'}
                </span>
              </BounceButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-sky-100 dark:divide-white/[0.06]">
            {filteredTx.map((x) => {
              const sign = x.type === 'income' || x.type === 'debt' ? '+' : '−';
              const rem = x.type === 'debt' || x.type === 'paona' ? x.amount - sumPay(x) : 0;
              const iconName =
                x.type === 'paona' ? 'hand' : findCategoryIcon(x.category);

              return (
                <BounceButton
                  key={x.id}
                  onClick={() => onOpenDetail(x)}
                  bounceScale={0.98}
                  className="w-full py-3.5 px-2 -mx-2 rounded-2xl hover:bg-sky-50/70 dark:hover:bg-white/[0.03] flex items-center justify-between gap-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SquircleIcon name={iconName} txType={x.type} size="md" />
                    <div className="min-w-0">
                      <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {x.desc}
                      </h5>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {catLabel(x.category, lang)} · {fmtDate(x.date, lang)}
                        {x.person ? ` · ${x.person}` : ''}
                      </p>
                      {(x.type === 'debt' || x.type === 'paona') && (
                        <p className={`text-[11px] font-medium mt-0.5 tabular-nums ${typeStyle(x.type)}`}>
                          {tr(lang, 'monthly')}: {money(x.amount / (x.months || 1), lang)} ·{' '}
                          {tr(lang, 'remaining')}: {money(rem, lang)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {x.voucher && (
                      <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className={`text-sm font-extrabold tabular-nums ${typeStyle(x.type)}`}>
                      {sign}
                      {money(x.amount, lang)}
                    </span>
                  </div>
                </BounceButton>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
