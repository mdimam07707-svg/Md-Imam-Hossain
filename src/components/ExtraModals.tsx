import React, { useEffect, useState } from 'react';
import {
  Camera,
  CloudUpload,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Lock,
  Pencil,
  Printer,
  Save,
  Unlock,
  X,
} from 'lucide-react';
import type { Language, PeriodKey, Transaction, UserProfile } from '../types/hisab';
import { catLabel } from '../data/categories';
import { MONTHS, tr, typeLabel } from '../data/i18n';
import { compressImage, currentHalf, personGroups, sumPeriod } from '../utils/storage';
import { BrandLogo } from './BrandLogo';
import { BounceButton, ModalSheet } from './MotionPrimitives';

/* ============ Profile Modal ============ */
interface ProfileModalProps {
  open: boolean;
  lang: Language;
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  lang,
  profile,
  onClose,
  onSave,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setEditing(false);
    }
  }, [open, profile]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    compressImage(f, 500, 0.85, (d) => setDraft((prev) => ({ ...prev, photo: d })));
  };

  return (
    <ModalSheet open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">{tr(lang, 'profile')}</h3>
          <div className="flex items-center gap-2">
            {!editing ? (
              <BounceButton
                onClick={() => setEditing(true)}
                aria-label={tr(lang, 'editE')}
                className="w-9 h-9 rounded-full bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 flex items-center justify-center"
              >
                <Pencil className="w-4 h-4" />
              </BounceButton>
            ) : (
              <BounceButton
                onClick={() => {
                  setDraft(profile);
                  setEditing(false);
                }}
                aria-label={tr(lang, 'cancel')}
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </BounceButton>
            )}
            <BounceButton
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </BounceButton>
          </div>
        </div>

        <div className="relative w-24 h-24 mx-auto">
          <img
            src={draft.photo}
            alt="Profile avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-100 dark:border-white/15"
          />
          {editing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 flex items-center justify-center cursor-pointer border-2 border-white dark:border-[#14161D]">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-zinc-500 mb-1">
              {tr(lang, 'name')}
            </label>
            <input
              type="text"
              disabled={!editing}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 font-semibold disabled:opacity-60"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-500 mb-1">
                {tr(lang, 'mobile')}
              </label>
              <input
                type="text"
                disabled={!editing}
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-500 mb-1">
                {tr(lang, 'occ')}
              </label>
              <input
                type="text"
                disabled={!editing}
                value={draft.occupation}
                onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 disabled:opacity-60"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-zinc-500 mb-1">
              {tr(lang, 'email')}
            </label>
            <input
              type="email"
              disabled={!editing}
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-500 mb-1">
              {tr(lang, 'address')}
            </label>
            <input
              type="text"
              disabled={!editing}
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-500 mb-1">
              {tr(lang, 'bio')}
            </label>
            <input
              type="text"
              disabled={!editing}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 disabled:opacity-60"
            />
          </div>
        </div>

        {editing && (
          <BounceButton
            onClick={() => {
              onSave({
                ...draft,
                name: draft.name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User'),
              });
              setEditing(false);
              onClose();
            }}
            sound="success"
            className="w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{tr(lang, 'updateP')}</span>
          </BounceButton>
        )}
      </div>
    </ModalSheet>
  );
};

/* ============ Save / Export Files Modal ============ */
interface SaveFilesModalProps {
  open: boolean;
  lang: Language;
  sheetUrl?: string | null;
  onClose: () => void;
  onDriveSync: () => void;
  onDownloadXlsx: () => void;
  onDownloadTxt: () => void;
  onDownloadJson: () => void;
  onPrintPdf: () => void;
}

export const SaveFilesModal: React.FC<SaveFilesModalProps> = ({
  open,
  lang,
  sheetUrl,
  onClose,
  onDriveSync,
  onDownloadXlsx,
  onDownloadTxt,
  onDownloadJson,
  onPrintPdf,
}) => (
  <ModalSheet open={open} onClose={onClose}>
    <div className="p-6 space-y-3 text-xs">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-extrabold">{tr(lang, 'saveFileT')}</h3>
        <BounceButton
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-sky-100/80 dark:bg-white/[0.08] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </BounceButton>
      </div>
      <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
        {tr(lang, 'emailOnPhone')}
      </p>
      <BounceButton
        onClick={() => {
          onClose();
          onDriveSync();
        }}
        className="w-full py-3 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold flex items-center justify-center gap-2 shadow-sm"
      >
        <CloudUpload className="w-4 h-4" />
        <span>{tr(lang, 'driveSyncNow')}</span>
      </BounceButton>
      {sheetUrl && (
        <a
          href={sheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <ExternalLink className="w-4 h-4" />
          <span>
            {lang === 'bn'
              ? 'সরাসরি Google Sheet-এ খুলুন'
              : 'Open Directly in Google Sheet'}
          </span>
        </a>
      )}
      <BounceButton
        onClick={onDownloadXlsx}
        className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>{tr(lang, 'downloadXlsx')}</span>
      </BounceButton>
      <BounceButton
        onClick={onDownloadJson}
        className="w-full py-3 rounded-2xl bg-sky-100/80 dark:bg-white/[0.07] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>{tr(lang, 'memJson')}</span>
      </BounceButton>
      <BounceButton
        onClick={onDownloadTxt}
        className="w-full py-3 rounded-2xl bg-sky-100/80 dark:bg-white/[0.07] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>{tr(lang, 'memTxt')}</span>
      </BounceButton>
      <BounceButton
        onClick={() => {
          onClose();
          onPrintPdf();
        }}
        className="w-full py-3 rounded-2xl bg-sky-100/80 dark:bg-white/[0.07] text-slate-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2"
      >
        <Printer className="w-4 h-4" />
        <span>{tr(lang, 'pdfSave')}</span>
      </BounceButton>
      <a
        href="/downloads/takar-hisab-website.zip"
        download="takar-hisab-website.zip"
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
      >
        <Globe className="w-4 h-4" />
        <span>
          {lang === 'bn'
            ? 'ওয়েবসাইট পাবলিশ ফাইল (.zip)'
            : 'Website Publish Bundle (.zip)'}
        </span>
      </a>
    </div>
  </ModalSheet>
);

/* ============ Report A4 Modal ============ */
interface ReportModalProps {
  open: boolean;
  lang: Language;
  profile: UserProfile;
  transactions: Transaction[];
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  open,
  lang,
  profile,
  transactions,
  onClose,
}) => {
  const periods: [PeriodKey, string][] = [
    ['month', tr(lang, 'thisMonth')],
    [currentHalf(), tr(lang, currentHalf())],
    ['year', tr(lang, 'year')],
  ];
  const debts = personGroups(transactions, 'debt');
  const paonas = personGroups(transactions, 'paona');

  const byMonth: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    const k = (t.date || '').slice(0, 7);
    (byMonth[k] = byMonth[k] || []).push(t);
  });

  return (
    <ModalSheet open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between no-print">
          <h3 className="text-base font-extrabold">{tr(lang, 'report')}</h3>
          <div className="flex items-center gap-2">
            <BounceButton
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{tr(lang, 'printBtn')}</span>
            </BounceButton>
            <BounceButton
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </BounceButton>
          </div>
        </div>

        <div
          id="report-print-area"
          className="bg-white text-zinc-900 p-5 sm:p-7 rounded-2xl border border-zinc-200 overflow-x-auto text-xs space-y-5"
        >
          <div className="text-center border-b border-zinc-200 pb-3">
            <h2 className="text-lg font-extrabold">Takar Hisab — সম্পূর্ণ রিপোর্ট</h2>
            <p className="text-zinc-500 text-[11px]">
              {profile.name || 'ব্যবহারকারী'} · {new Date().toLocaleString('bn-BD')}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-2">{tr(lang, 'summary')}</h4>
            <table className="w-full border-collapse text-[11px] tabular-nums">
              <thead>
                <tr className="bg-zinc-100 text-left">
                  <th className="p-2">সময়কাল</th>
                  <th className="p-2">আয়</th>
                  <th className="p-2">ব্যয়</th>
                  <th className="p-2">ঋণ</th>
                  <th className="p-2">পাওনা</th>
                  <th className="p-2 text-right">ব্যালেন্স</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(([k, label]) => {
                  const s = sumPeriod(transactions, k);
                  return (
                    <tr key={k} className="border-b border-zinc-100">
                      <td className="p-2 font-medium">{label}</td>
                      <td className="p-2">{s.income.toLocaleString('en-IN')}</td>
                      <td className="p-2">{s.expense.toLocaleString('en-IN')}</td>
                      <td className="p-2">{s.debt.toLocaleString('en-IN')}</td>
                      <td className="p-2">{s.paona.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold">
                        {s.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {debts.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-2">{tr(lang, 'loanSec')}</h4>
              <table className="w-full border-collapse text-[11px] tabular-nums">
                <thead>
                  <tr className="bg-zinc-100 text-left">
                    <th className="p-2">{tr(lang, 'person')}</th>
                    <th className="p-2">{tr(lang, 'total')}</th>
                    <th className="p-2">{tr(lang, 'repaid')}</th>
                    <th className="p-2 text-right">{tr(lang, 'remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((g) => (
                    <tr key={g.person} className="border-b border-zinc-100">
                      <td className="p-2">{g.person}</td>
                      <td className="p-2">{g.total.toLocaleString('en-IN')}</td>
                      <td className="p-2">{g.paid.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold">
                        {(g.total - g.paid).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paonas.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-2">{tr(lang, 'paonaSec')}</h4>
              <table className="w-full border-collapse text-[11px] tabular-nums">
                <thead>
                  <tr className="bg-zinc-100 text-left">
                    <th className="p-2">{tr(lang, 'person')}</th>
                    <th className="p-2">{tr(lang, 'given')}</th>
                    <th className="p-2">{tr(lang, 'collected')}</th>
                    <th className="p-2 text-right">{tr(lang, 'remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paonas.map((g) => (
                    <tr key={g.person} className="border-b border-zinc-100">
                      <td className="p-2">{g.person}</td>
                      <td className="p-2">{g.total.toLocaleString('en-IN')}</td>
                      <td className="p-2">{g.paid.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-bold">
                        {(g.total - g.paid).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm mb-2">{tr(lang, 'recent')}</h4>
            {Object.keys(byMonth)
              .sort()
              .reverse()
              .map((k) => (
                <div key={k} className="mb-3">
                  <p className="font-bold text-xs mb-1">
                    {MONTHS.bn[Number(k.slice(5, 7)) - 1] || k} {k.slice(0, 4)}
                  </p>
                  <table className="w-full border-collapse text-[11px] tabular-nums">
                    <thead>
                      <tr className="bg-zinc-100 text-left">
                        <th className="p-1.5">তারিখ</th>
                        <th className="p-1.5">বিবরণ</th>
                        <th className="p-1.5">খাত</th>
                        <th className="p-1.5">ধরণ</th>
                        <th className="p-1.5 text-right">৳</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byMonth[k].map((x) => (
                        <tr key={x.id} className="border-b border-zinc-100">
                          <td className="p-1.5">{x.date}</td>
                          <td className="p-1.5">
                            {x.desc}
                            {x.person ? ` (${x.person})` : ''}
                          </td>
                          <td className="p-1.5">{catLabel(x.category, lang)}</td>
                          <td className="p-1.5">{typeLabel(x.type, lang)}</td>
                          <td className="p-1.5 text-right font-semibold">
                            {x.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            {transactions.length === 0 && (
              <p className="text-zinc-400">{tr(lang, 'empty')}</p>
            )}
          </div>
        </div>
      </div>
    </ModalSheet>
  );
};

/* ============ Voucher Preview Lightbox ============ */
export const VoucherModal: React.FC<{
  src: string | null;
  onClose: () => void;
}> = ({ src, onClose }) => (
  <ModalSheet open={!!src} onClose={onClose} zIndex="z-[60]">
    {src && (
      <div className="p-4 text-center space-y-3">
        <div className="flex justify-end">
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>
        <img
          src={src}
          alt="Full voucher"
          className="max-h-[75vh] mx-auto rounded-2xl object-contain"
        />
      </div>
    )}
  </ModalSheet>
);

/* ============ Lock Screen ============ */
interface LockScreenProps {
  open: boolean;
  lang: Language;
  profile: UserProfile;
  onUnlock: (pin: string) => Promise<boolean>;
  onResetAll: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  open,
  lang,
  profile,
  onUnlock,
  onResetAll,
}) => {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    const ok = await onUnlock(pin);
    if (!ok) {
      setErr(lang === 'bn' ? 'ভুল PIN!' : 'Incorrect PIN!');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#090A0D] text-white flex flex-col items-center justify-center gap-5 p-8 text-center">
      <BrandLogo size="lg" />
      <img
        src={profile.photo}
        alt="Profile"
        className="w-20 h-20 rounded-full border-2 border-[#C4F135] object-cover"
      />
      <div>
        <h2 className="text-lg font-extrabold">{profile.name || 'Takar Hisab'}</h2>
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1 mt-1">
          <Lock className="w-3.5 h-3.5 text-[#C4F135]" />
          <span>{tr(lang, 'appLock')}</span>
        </p>
      </div>
      <input
        type="password"
        maxLength={4}
        inputMode="numeric"
        value={pin}
        onChange={(e) => {
          setErr('');
          setPin(e.target.value);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="••••"
        className="w-36 text-center tracking-[0.5em] text-xl bg-white/10 text-white rounded-2xl py-3 border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#C4F135]"
      />
      {err && <p className="text-xs text-rose-400 font-semibold">{err}</p>}
      <BounceButton
        onClick={submit}
        className="px-8 py-3 rounded-2xl bg-[#C4F135] text-zinc-950 font-bold text-sm flex items-center gap-2"
      >
        <Unlock className="w-4 h-4" />
        <span>{tr(lang, 'unlock')}</span>
      </BounceButton>
      <button
        type="button"
        onClick={onResetAll}
        className="text-xs text-zinc-500 underline mt-2"
      >
        {tr(lang, 'stReset')}
      </button>
    </div>
  );
};

/* ============ PIN Prompt Modal ============ */
interface PinDialogProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (pin: string) => void;
}

export const PinDialog: React.FC<PinDialogProps> = ({
  open,
  title,
  onCancel,
  onConfirm,
}) => {
  const [val, setVal] = useState('');
  useEffect(() => {
    if (open) setVal('');
  }, [open]);

  return (
    <ModalSheet open={open} onClose={onCancel} maxWidth="max-w-xs" zIndex="z-[110]">
      <div className="p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-center">{title}</h3>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(val)}
          placeholder="••••"
          className="w-full text-center tracking-[0.5em] text-lg py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/15"
        />
        <div className="grid grid-cols-2 gap-2">
          <BounceButton
            onClick={onCancel}
            className="py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.08] font-semibold text-xs"
          >
            Cancel
          </BounceButton>
          <BounceButton
            onClick={() => onConfirm(val)}
            className="py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold text-xs"
          >
            OK
          </BounceButton>
        </div>
      </div>
    </ModalSheet>
  );
};
