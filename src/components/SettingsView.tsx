import React, { useState } from 'react';
import {
  ChevronDown,
  CloudDownload,
  CloudUpload,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Sun,
  Upload,
} from 'lucide-react';
import type { Language, ThemeMode, UserProfile } from '../types/hisab';
import { ALL_CAT_NAMES, catLabel } from '../data/categories';
import { tr } from '../data/i18n';
import { SquircleIcon } from './CategoryIcon';
import { GoogleSignInButton } from './GoogleAuthModal';
import { BounceButton } from './MotionPrimitives';

interface SettingsViewProps {
  lang: Language;
  theme: ThemeMode;
  profile: UserProfile;
  googleUserEmail: string | null;
  lastDriveSync: string | null;
  driveSyncing: boolean;
  soundOn: boolean;
  appLock: boolean;
  reminders: { kisti: boolean; paona: boolean; dena: boolean };
  defaultCat: string;
  monthlyBudget: number;
  defaultMonths: number;
  reminderDays: number;
  onSetTheme: (th: ThemeMode) => void;
  onSetLanguage: (l: Language) => void;
  onOpenProfile: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onDriveSync: () => void;
  onDriveRestore: () => void;
  onExportXlsx: () => void;
  onToggleSound: (val: boolean) => void;
  onToggleReminder: (key: 'kisti' | 'paona' | 'dena', val: boolean) => void;
  onToggleAppLock: (val: boolean) => void;
  onChangePin: () => void;
  onSaveAccounting: (cfg: {
    defaultCat?: string;
    monthlyBudget?: number;
    defaultMonths?: number;
    reminderDays?: number;
  }) => void;
  onExportJson: () => void;
  onExportTxt: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenReport: () => void;
  onOpenSaveFiles: () => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  lang,
  theme,
  profile,
  googleUserEmail,
  lastDriveSync,
  driveSyncing,
  soundOn,
  appLock,
  reminders,
  defaultCat,
  monthlyBudget,
  defaultMonths,
  reminderDays,
  onSetTheme,
  onSetLanguage,
  onOpenProfile,
  onGoogleSignIn,
  onGoogleSignOut,
  onDriveSync,
  onDriveRestore,
  onExportXlsx,
  onToggleSound,
  onToggleReminder,
  onToggleAppLock,
  onChangePin,
  onSaveAccounting,
  onExportJson,
  onExportTxt,
  onImportJson,
  onOpenReport,
  onOpenSaveFiles,
  onResetAll,
}) => {
  const [openAcc, setOpenAcc] = useState<string>('theme');
  const [budgetInput, setBudgetInput] = useState(
    monthlyBudget > 0 ? String(monthlyBudget) : ''
  );

  const toggleAcc = (id: string) =>
    setOpenAcc((prev) => (prev === id ? '' : id));

  const nowStr = (() => {
    const loc = { bn: 'bn-BD', en: 'en-GB', ar: 'ar-EG', zh: 'zh-CN' }[lang] || 'bn-BD';
    try {
      return new Date().toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return new Date().toLocaleString();
    }
  })();

  const sections: {
    id: string;
    title: string;
    iconName: string;
    content: React.ReactNode;
  }[] = [
    {
      id: 'google',
      title: tr(lang, 'driveSave'),
      iconName: 'cloud',
      content: (
        <div className="space-y-3 text-xs">
          {googleUserEmail ? (
            <>
              <div className="p-3 rounded-2xl bg-sky-50/90 dark:bg-white/[0.04] border border-sky-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {googleUserEmail}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {lastDriveSync
                      ? `${lang === 'bn' ? 'সর্বশেষ Drive সিঙ্ক' : 'Last Drive sync'}: ${new Date(
                          lastDriveSync
                        ).toLocaleString()}`
                      : lang === 'bn'
                      ? 'Google Drive সংযুক্ত'
                      : 'Google Drive connected'}
                  </p>
                </div>
                <BounceButton
                  onClick={onGoogleSignOut}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'signOutGoogle')}</span>
                </BounceButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <BounceButton
                  onClick={onDriveSync}
                  disabled={driveSyncing}
                  className="py-2.5 px-3 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold flex items-center justify-center gap-2"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>
                    {driveSyncing
                      ? lang === 'bn'
                        ? 'আপলোড হচ্ছে...'
                        : 'Syncing...'
                      : tr(lang, 'driveSyncNow')}
                  </span>
                </BounceButton>
                <BounceButton
                  onClick={onDriveRestore}
                  disabled={driveSyncing}
                  className="py-2.5 px-3 rounded-xl bg-sky-100/80 dark:bg-white/[0.07] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>{tr(lang, 'driveRestoreNow')}</span>
                </BounceButton>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                {tr(lang, 'googleLoginSub')}
              </p>
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                label={
                  lang === 'bn'
                    ? 'Gmail (Google) দিয়ে লগইন করুন'
                    : 'Continue with Google'
                }
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'theme',
      title: tr(lang, 'stAppear'),
      iconName: 'sparkles',
      content: (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['light', tr(lang, 'stLight'), Sun],
              ['dark', tr(lang, 'stDark'), Moon],
              ['system', tr(lang, 'stSystem'), Monitor],
            ] as [ThemeMode, string, React.ComponentType<{ className?: string }>][]
          ).map(([mode, label, Icon]) => {
            const active = theme === mode;
            return (
              <BounceButton
                key={mode}
                onClick={() => onSetTheme(mode)}
                className={`relative py-3 px-2 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 border transition-colors ${
                  active
                    ? 'bg-[#1677E8] dark:bg-[#C4F135] border-[#1677E8] dark:border-[#C4F135] text-white dark:text-zinc-950 shadow-sm'
                    : 'border-sky-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 bg-white/75 dark:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </BounceButton>
            );
          })}
        </div>
      ),
    },
    {
      id: 'notif',
      title: tr(lang, 'stNotif'),
      iconName: 'bell',
      content: (
        <div className="space-y-3 text-xs">
          {(
            [
              ['kisti', tr(lang, 'stKistiRem'), reminders.kisti],
              ['paona', tr(lang, 'stPaonaRem'), reminders.paona],
              ['dena', tr(lang, 'stDenaRem'), reminders.dena],
            ] as ['kisti' | 'paona' | 'dena', string, boolean][]
          ).map(([k, label, checked]) => (
            <label
              key={k}
              className="flex items-center justify-between gap-3 py-1 cursor-pointer"
            >
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                {label}
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggleReminder(k, e.target.checked)}
                className="w-5 h-5 accent-[#1677E8] dark:accent-[#84CC16] rounded cursor-pointer"
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 pt-3 border-t border-sky-100 dark:border-white/[0.06] cursor-pointer">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              {tr(lang, 'stSound')}
            </span>
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => onToggleSound(e.target.checked)}
              className="w-5 h-5 accent-[#1677E8] dark:accent-[#84CC16] rounded cursor-pointer"
            />
          </label>
        </div>
      ),
    },
    {
      id: 'sec',
      title: tr(lang, 'stSec'),
      iconName: 'key',
      content: (
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-zinc-200">
              <Lock className="w-4 h-4 text-slate-500" />
              {tr(lang, 'appLock')}
            </span>
            <input
              type="checkbox"
              checked={appLock}
              onChange={(e) => onToggleAppLock(e.target.checked)}
              className="w-5 h-5 accent-[#1677E8] dark:accent-[#84CC16] rounded cursor-pointer"
            />
          </label>
          <BounceButton
            onClick={onChangePin}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-bold flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{tr(lang, 'stChangePin')}</span>
          </BounceButton>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            {tr(lang, 'privTxt')}
          </p>
        </div>
      ),
    },
    {
      id: 'lang',
      title: tr(lang, 'stLangReg'),
      iconName: 'map',
      content: (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {tr(lang, 'language')}
            </span>
            <select
              value={lang}
              onChange={(e) => onSetLanguage(e.target.value as Language)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#171A23] border border-zinc-200 dark:border-white/15 font-semibold text-zinc-900 dark:text-zinc-100"
            >
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-white/[0.06]">
            <span className="text-zinc-500 dark:text-zinc-400">
              {tr(lang, 'stCurrency')}
            </span>
            <strong className="text-zinc-900 dark:text-zinc-100">৳ BDT</strong>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-white/[0.06]">
            <span className="text-zinc-500 dark:text-zinc-400">
              {tr(lang, 'stDateReg')}
            </span>
            <strong className="text-[11px] text-zinc-900 dark:text-zinc-100 tabular-nums">
              {nowStr}
            </strong>
          </div>
        </div>
      ),
    },
    {
      id: 'backup',
      title: tr(lang, 'stBackup'),
      iconName: 'file-invoice',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <BounceButton
            onClick={onExportXlsx}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 sm:col-span-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{tr(lang, 'downloadXlsx')}</span>
          </BounceButton>
          <BounceButton
            onClick={onOpenSaveFiles}
            className="py-2.5 px-3 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold flex items-center justify-center gap-2 sm:col-span-2"
          >
            <Download className="w-4 h-4" />
            <span>{tr(lang, 'stFileSave')}</span>
          </BounceButton>
          <BounceButton
            onClick={onExportJson}
            className="py-2.5 px-3 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{tr(lang, 'stBackupJson')}</span>
          </BounceButton>
          <label className="py-2.5 px-3 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform">
            <Upload className="w-4 h-4" />
            <span>{tr(lang, 'restore')}</span>
            <input
              type="file"
              accept=".json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={onImportJson}
              className="hidden"
            />
          </label>
          <BounceButton
            onClick={onOpenReport}
            className="py-2.5 px-3 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{tr(lang, 'pdfSave')}</span>
          </BounceButton>
          <BounceButton
            onClick={onExportTxt}
            className="py-2.5 px-3 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{tr(lang, 'stExpTxt')}</span>
          </BounceButton>
        </div>
      ),
    },
    {
      id: 'hset',
      title: tr(lang, 'stAccSet'),
      iconName: 'gear',
      content: (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              {tr(lang, 'stDefCat')}
            </label>
            <select
              value={defaultCat}
              onChange={(e) => onSaveAccounting({ defaultCat: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#171A23] border border-zinc-200 dark:border-white/15 text-zinc-900 dark:text-zinc-100"
            >
              <option value="">—</option>
              {ALL_CAT_NAMES.map((n) => (
                <option key={n} value={n}>
                  {catLabel(n, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              {tr(lang, 'stBudget')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 tabular-nums"
              />
              <BounceButton
                onClick={() =>
                  onSaveAccounting({ monthlyBudget: parseFloat(budgetInput) || 0 })
                }
                className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
              </BounceButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                {tr(lang, 'stKistiSet')}
              </label>
              <input
                type="number"
                min={1}
                value={defaultMonths}
                onChange={(e) =>
                  onSaveAccounting({
                    defaultMonths: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                {tr(lang, 'stRemDays')}
              </label>
              <input
                type="number"
                min={1}
                value={reminderDays}
                onChange={(e) =>
                  onSaveAccounting({
                    reminderDays: Math.max(1, parseInt(e.target.value, 10) || 3),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 tabular-nums"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'help',
      title: tr(lang, 'stHelp'),
      iconName: 'book',
      content: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
          <p>
            {lang === 'bn'
              ? '+ বাটনে ট্যাপ করে আয়, ব্যয়, ঋণ বা পাওনা যোগ করুন। ঋণ ও পাওনা তালিকায় নামে ট্যাপ করে কিস্তি পরিশোধ বা আদায় করতে পারবেন।'
              : 'Tap + to add income, expense, loan, or receivable entries. Tap any person in Loans or Receivables to record repayments.'}
          </p>
          <a
            href="mailto:support@hisab.app"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-slate-900 dark:text-zinc-100 font-semibold"
          >
            <Mail className="w-4 h-4" />
            <span>{tr(lang, 'stFeedback')}</span>
          </a>
        </div>
      ),
    },
    {
      id: 'about',
      title: tr(lang, 'stAbout'),
      iconName: 'star',
      content: (
        <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400">
          <div className="flex justify-between">
            <span>{tr(lang, 'stVersion')}</span>
            <strong className="text-slate-900 dark:text-zinc-100">5.0</strong>
          </div>
          <div className="flex justify-between">
            <span>{lang === 'bn' ? 'তৈরি করেছেন' : 'Developer'}</span>
            <strong className="text-slate-900 dark:text-[#C4F135]">MD IMAM HOSSAIN</strong>
          </div>
          <p>{tr(lang, 'privTxt')}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-6">
      {/* Profile Row */}
      <BounceButton
        onClick={onOpenProfile}
        bounceScale={0.98}
        className="w-full rounded-[28px] p-4 sm:p-5 glass-card border border-sky-200/80 dark:border-white/12 shadow-sm flex items-center gap-4 text-left"
      >
        <img
          src={profile.photo}
          alt={profile.name || 'Profile'}
          className="w-14 h-14 rounded-2xl object-cover border border-sky-200 dark:border-white/15 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-zinc-50 truncate">
            {profile.name || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
            {googleUserEmail || profile.phone || profile.email || tr(lang, 'editE')}
          </p>
        </div>
        <span className="w-10 h-10 rounded-xl bg-sky-100/80 dark:bg-white/[0.06] text-[#1677E8] dark:text-[#C4F135] flex items-center justify-center shrink-0">
          <Pencil className="w-4 h-4" />
        </span>
      </BounceButton>

      {/* Accordions */}
      <div className="space-y-2.5">
        {sections.map((sec) => {
          const isOpen = openAcc === sec.id;
          return (
            <div
              key={sec.id}
              className="rounded-[24px] glass-card border border-sky-200/80 dark:border-white/10 overflow-hidden shadow-sm"
            >
              <BounceButton
                onClick={() => toggleAcc(sec.id)}
                bounceScale={0.99}
                className="w-full px-5 py-4 flex items-center gap-3 text-left"
              >
                <SquircleIcon name={sec.iconName} size="sm" />
                <span className="flex-1 text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {sec.title}
                </span>
                <span
                  className={`text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </span>
              </BounceButton>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-sky-100 dark:border-white/[0.06]">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset All Data */}
      <BounceButton
        onClick={onResetAll}
        className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
      >
        <RotateCcw className="w-4 h-4" />
        <span>{tr(lang, 'stReset')}</span>
      </BounceButton>
    </div>
  );
};
