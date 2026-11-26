import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  FileSpreadsheet,
  Globe,
  Layers,
  Pencil,
  Plus,
  Send,
  Upload,
} from 'lucide-react';
import type { Language, Transaction, TxType, UserProfile } from '../types/hisab';
import {
  CATEGORY_GROUPS,
  PROBASHI_GROUP_TITLE,
  QUICK_CATEGORIES,
  TOTAL_ITEMS,
  catLabel,
} from '../data/categories';
import { fmtNum, money, tr } from '../data/i18n';
import { currentHalf, personGroups, sumPeriod } from '../utils/storage';
import { SquircleIcon } from './CategoryIcon';
import { AnimatedNumber, BounceButton } from './MotionPrimitives';
import { RadialSummaryOrb } from './RadialSummaryOrb';
import { TrendSplineChart } from './TrendSplineChart';

const PROBASHI_CAT_SET = new Set(
  (CATEGORY_GROUPS.find((g) => g.title === PROBASHI_GROUP_TITLE)?.items || []).map(
    (i) => i.name
  )
);

const PROBASHI_HIGHLIGHT_CATS = [
  'বাড়িতে টাকা পাঠানো',
  'পরিবারের মাসিক খরচ',
  'ভিসা / ইকামা নবায়ন',
  'বিমান টিকিট (দেশে যাওয়া-আসা)',
];

interface HomeViewProps {
  lang: Language;
  isDark: boolean;
  profile: UserProfile;
  transactions: Transaction[];
  googleUserEmail: string | null;
  lastDriveSync: string | null;
  driveSyncing: boolean;
  onOpenProfile: () => void;
  onOpenCategories: () => void;
  onOpenProbashi: () => void;
  onQuickAdd: (catName?: string, ty?: TxType) => void;
  onGoAccounts: () => void;
  onOpenLoansOverview: () => void;
  onTriggerDriveSync: () => void;
  onTriggerDriveRestore: () => void;
  onImportBackupFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGoogleLogin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lang,
  isDark,
  profile,
  transactions,
  googleUserEmail,
  lastDriveSync,
  driveSyncing,
  onOpenProfile,
  onOpenCategories,
  onOpenProbashi,
  onQuickAdd,
  onGoAccounts,
  onOpenLoansOverview,
  onTriggerDriveSync,
  onTriggerDriveRestore,
  onImportBackupFile,
  onOpenGoogleLogin,
}) => {
  const halfKey = currentHalf();
  const halfSummary = sumPeriod(transactions, halfKey);
  const monthSummary = sumPeriod(transactions, 'month');

  const probashiTotal = useMemo(
    () =>
      transactions.reduce(
        (sum, tx) => (PROBASHI_CAT_SET.has(tx.category) ? sum + tx.amount : sum),
        0
      ),
    [transactions]
  );

  const loanSummary = useMemo(() => {
    const given = personGroups(transactions, 'paona');
    const taken = personGroups(transactions, 'debt');
    const totalGiven = given.reduce((a, g) => a + g.total, 0);
    const totalTaken = taken.reduce((a, g) => a + g.total, 0);
    const remGiven = given.reduce((a, g) => a + Math.max(0, g.total - g.paid), 0);
    const remTaken = taken.reduce((a, g) => a + Math.max(0, g.total - g.paid), 0);
    return { totalGiven, totalTaken, remGiven, remTaken };
  }, [transactions]);

  return (
    <div className="space-y-5 pb-6">
      {/* Quick Data Recovery Card when local ledger is empty */}
      {transactions.length === 0 && (
        <div className="rounded-[24px] p-4 bg-sky-50/95 dark:bg-[#131822] border border-sky-300/80 dark:border-[#C4F135]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'আগের হিসাব বা ব্যাকআপ ডাটা ফিরিয়ে আনতে চান?'
                : 'Want to restore your previous transactions?'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'আগে Gmail/Google Drive বা ফাইলে (.json / .xlsx) সেভ থাকলে এক ক্লিকেই সব ডাটা ফিরে পাবেন।'
                : 'Restore all previous entries from Google Drive or a saved .json / .xlsx backup file.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <BounceButton
              onClick={googleUserEmail ? onTriggerDriveRestore : onOpenGoogleLogin}
              disabled={driveSyncing}
              className="px-3.5 py-2 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>
                {googleUserEmail
                  ? lang === 'bn'
                    ? 'Drive থেকে আনুন'
                    : 'Restore from Drive'
                  : lang === 'bn'
                  ? 'Gmail দিয়ে ফিরিয়ে আনুন'
                  : 'Sign in & Restore'}
              </span>
            </BounceButton>
            <label className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.08] border border-sky-200 dark:border-white/15 text-slate-800 dark:text-zinc-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform">
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফাইল থেকে আনুন' : 'Import File'}</span>
              <input
                type="file"
                accept=".json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={onImportBackupFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Top Grid: Profile + Monthly Snapshot on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Profile & Cloud Sync Identity Card */}
        <div
          className="lg:col-span-5 flex flex-col justify-between rounded-[28px] p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={profile.photo}
                alt={profile.name || 'Profile'}
                className="w-14 h-14 rounded-2xl object-cover border border-sky-200 dark:border-white/15 bg-sky-50 dark:bg-zinc-900 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {tr(lang, 'welcome')}
                </p>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-zinc-50 truncate">
                  {profile.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  {googleUserEmail || profile.bio || profile.occupation || (lang === 'bn' ? 'পরিচিতি যোগ করুন' : 'Add bio')}
                </p>
              </div>
            </div>
            <BounceButton
              onClick={onOpenProfile}
              aria-label={tr(lang, 'editE')}
              className="w-11 h-11 rounded-2xl bg-sky-100/80 dark:bg-white/[0.07] text-[#1677E8] dark:text-[#C4F135] flex items-center justify-center shrink-0"
            >
              <Pencil className="w-4 h-4" />
            </BounceButton>
          </div>

          {/* Gmail / Google Drive Excel Sync Strip */}
          <div className="mt-4">
            {googleUserEmail ? (
              <BounceButton
                onClick={onTriggerDriveSync}
                disabled={driveSyncing}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-sky-50/90 dark:bg-white/[0.05] border border-sky-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SquircleIcon name="cloud" size="xs" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {driveSyncing
                        ? lang === 'bn'
                          ? 'Excel (.xlsx) Drive-এ সেভ হচ্ছে...'
                          : 'Saving Excel to Drive...'
                        : tr(lang, 'driveSyncNow')}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      {lastDriveSync
                        ? `${lang === 'bn' ? 'সর্বশেষ' : 'Last'}: ${new Date(lastDriveSync).toLocaleTimeString()}`
                        : googleUserEmail}
                    </p>
                  </div>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135] shrink-0" />
              </BounceButton>
            ) : (
              <BounceButton
                onClick={onOpenGoogleLogin}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-sky-50/90 dark:bg-white/[0.05] border border-sky-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SquircleIcon name="cloud" size="xs" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                    {tr(lang, 'googleLoginTitle')}
                  </span>
                </div>
                <CloudUpload className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135] shrink-0" />
              </BounceButton>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-sky-200/70 dark:border-white/[0.08] flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {tr(lang, 'thisMonth')} · {tr(lang, 'balanceL')}
              </p>
              <p className="text-2xl font-extrabold text-slate-950 dark:text-white tabular-nums mt-0.5">
                <AnimatedNumber value={monthSummary.balance} formatter={(n) => money(n, lang)} />
              </p>
            </div>
            <BounceButton
              onClick={onGoAccounts}
              className="px-3.5 py-2 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            >
              <span>{tr(lang, 'accounts')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </BounceButton>
          </div>
        </div>

        {/* Radial Summary Orb */}
        <div className="lg:col-span-7">
          <RadialSummaryOrb
            summary={halfSummary}
            periodLabel={tr(lang, halfKey)}
            lang={lang}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Dedicated Clickable "ঋণ দেওয়া ও ঋণ নেওয়া" (Loans Given & Taken) Banner Card */}
      <div>
        <BounceButton
          onClick={onOpenLoansOverview}
          bounceScale={0.985}
          className="w-full rounded-[26px] p-4 sm:p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3.5">
            <SquircleIcon name="hand" txType="paona" size="lg" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{tr(lang, 'loansOverview')}</span>
                <ChevronRight className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135]" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn'
                  ? 'কত টাকা ঋণ দিয়েছেন ও কত টাকা ঋণ নিয়েছেন দেখতে ট্যাপ করুন'
                  : 'Tap to view full breakdown of loans given and taken'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 border border-violet-300/50 dark:border-violet-400/20">
              <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>{tr(lang, 'loanGivenLabel')}</span>
              </p>
              <p className="text-sm font-extrabold text-slate-950 dark:text-white tabular-nums mt-0.5">
                {money(loanSummary.totalGiven, lang)}
              </p>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/50 dark:border-amber-400/20">
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3" />
                <span>{tr(lang, 'loanTakenLabel')}</span>
              </p>
              <p className="text-sm font-extrabold text-slate-950 dark:text-white tabular-nums mt-0.5">
                {money(loanSummary.totalTaken, lang)}
              </p>
            </div>
          </div>
        </BounceButton>
      </div>

      {/* Dedicated Probashi (Expatriate) Expenses & Remittance Card */}
      <section className="rounded-[26px] p-4 sm:p-5 glass-card border border-emerald-300/80 dark:border-emerald-400/25 shadow-sm bg-gradient-to-br from-emerald-50/70 via-white/60 to-sky-50/60 dark:from-emerald-950/30 dark:via-[#11161D]/80 dark:to-sky-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25">
              <Globe className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'প্রবাসী খরচ ও দেশে টাকা পাঠানো'
                    : 'Probashi (Expatriate) Expenses'}
                </h3>
                {probashiTotal > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-[#86E37D] text-[11px] font-extrabold tabular-nums">
                    {money(probashiTotal, lang)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                {lang === 'bn'
                  ? 'প্রবাসী ভাই-বোনদের দেশে টাকা পাঠানো, ভিসা-ইকামা ও বিদেশের সকল খরচ'
                  : 'Quick-select home remittance, visa/iqama, flight & abroad expenses'}
              </p>
            </div>
          </div>

          <BounceButton
            onClick={onOpenProbashi}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-md shadow-emerald-600/25"
          >
            <Globe className="w-4 h-4" />
            <span>
              {lang === 'bn' ? 'প্রবাসী অপশন খুলুন' : 'Open Probashi List'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </BounceButton>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          {PROBASHI_HIGHLIGHT_CATS.map((catName) => (
            <BounceButton
              key={catName}
              onClick={() => onQuickAdd(catName, 'expense')}
              bounceScale={0.94}
              className="px-3 py-1.5 rounded-xl bg-white/85 dark:bg-white/[0.06] hover:bg-emerald-50 dark:hover:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-400/20 text-[11px] font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              {catName === 'বাড়িতে টাকা পাঠানো' && (
                <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-[#86E37D]" />
              )}
              <span>{catLabel(catName, lang)}</span>
            </BounceButton>
          ))}
        </div>
      </section>

      {/* Middle Grid: Trend Spline Chart + Quick Category Action Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <TrendSplineChart transactions={transactions} lang={lang} isDark={isDark} />
        </div>

        {/* Quick Categories with Vivid Squircle App Icons */}
        <section
          className="lg:col-span-5 rounded-[28px] p-5 sm:p-6 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {tr(lang, 'quick')}
            </h3>
            <BounceButton
              onClick={onOpenCategories}
              className="text-xs font-semibold text-[#1677E8] dark:text-[#C4F135] hover:underline px-2 py-1 rounded-lg whitespace-nowrap"
            >
              {tr(lang, 'viewAll')} ({fmtNum(TOTAL_ITEMS, lang)})
            </BounceButton>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2.5">
            {QUICK_CATEGORIES.map((c) => (
              <BounceButton
                key={c.name}
                onClick={() => onQuickAdd(c.name, c.ty)}
                bounceScale={0.9}
                className="group flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/75 dark:bg-white/[0.04] hover:bg-sky-50 dark:hover:bg-[#C4F135]/12 border border-sky-200/70 dark:border-white/[0.08] dark:hover:border-[#C4F135]/30 min-h-[86px] transition-colors shadow-xs"
              >
                <div className="mb-2">
                  <SquircleIcon name={c.icon} txType={c.ty} size="md" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-zinc-100 text-center leading-tight line-clamp-2">
                  {catLabel(c.name, lang)}
                </span>
              </BounceButton>
            ))}

            <BounceButton
              onClick={onOpenCategories}
              bounceScale={0.9}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 min-h-[86px] shadow-md"
            >
              <div className="w-10 h-10 rounded-[13px] bg-white/20 dark:bg-black/10 flex items-center justify-center mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">
                {catLabel('আরও', lang)} ({fmtNum(TOTAL_ITEMS, lang)}+)
              </span>
            </BounceButton>
          </div>

          <BounceButton
            onClick={() => onQuickAdd()}
            sound="click"
            className="mt-4 w-full py-3 px-4 rounded-2xl bg-[#1677E8] text-white dark:bg-white dark:text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{tr(lang, 'newE')}</span>
          </BounceButton>
        </section>
      </div>
    </div>
  );
};
