import React from 'react';
import { CheckCircle2, CloudUpload, FileSpreadsheet, ShieldCheck, X } from 'lucide-react';
import type { Language } from '../types/hisab';
import { tr } from '../data/i18n';
import { BrandLogo } from './BrandLogo';
import { BounceButton, ModalSheet } from './MotionPrimitives';

export const GoogleSignInButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}> = ({ onClick, disabled, label = 'Continue with Google' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full h-11 px-4 rounded-xl bg-white text-[#1f1f1f] border border-[#747775] hover:bg-[#f8f9fa] active:scale-[0.98] transition-all font-medium text-sm flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-60"
  >
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
    <span>{label}</span>
  </button>
);

interface GoogleAuthModalProps {
  open: boolean;
  lang: Language;
  loading: boolean;
  authError?: string | null;
  onSignIn: () => void;
  onSkip: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  open,
  lang,
  loading,
  authError,
  onSignIn,
  onSkip,
}) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <ModalSheet open={open} onClose={onSkip} maxWidth="max-w-md" zIndex="z-[80]">
      <div className="relative overflow-hidden p-6 sm:p-7">
        <div className="flex justify-end">
          <BounceButton
            onClick={onSkip}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-sky-100/80 dark:bg-white/[0.08] text-sky-900 dark:text-zinc-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        <div className="text-center space-y-4 mt-1">
          <div className="mx-auto w-fit">
            <BrandLogo size="lg" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tr(lang, 'googleLoginTitle')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mt-1.5">
              {tr(lang, 'googleLoginSub')}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-sky-50/90 dark:bg-white/[0.04] border border-sky-200/80 dark:border-white/10 text-left space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135] shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-zinc-200">
                {lang === 'bn'
                  ? 'সব আয়, ব্যয়, ঋণ দেওয়া ও ঋণ নেওয়ার তথ্য Excel (.xlsx) ও Google Sheet-এ সেভ হবে।'
                  : 'Saves all income, expense & loan records in Excel (.xlsx) and Google Sheets.'}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CloudUpload className="w-4 h-4 text-[#1677E8] dark:text-[#C4F135] shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-zinc-200">
                {lang === 'bn'
                  ? 'আপনার নিজস্ব Google Drive-এর "Takar Hisab" ফোল্ডারে নিরাপদে ব্যাকআপ থাকবে।'
                  : 'Stored directly inside your personal Google Drive "Takar Hisab" folder.'}
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-700 dark:text-zinc-200">
                {lang === 'bn'
                  ? 'ফোন হারালেও বা নতুন ডিভাইসে ইনস্টল করলেও Gmail দিয়ে সহজেই সব হিসাব ফিরে পাবেন।'
                  : 'Restore your full ledger anytime by signing back in with your Gmail.'}
              </span>
            </div>
          </div>

          {authError && (
            <div className="rounded-2xl p-3 bg-rose-500/12 border border-rose-500/35 text-rose-700 dark:text-rose-300 text-xs font-semibold space-y-2">
              <p>{authError}</p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold"
              >
                {lang === 'bn' ? 'নতুন ট্যাবে অ্যাপ খুলুন' : 'Open App in New Tab'}
              </a>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <GoogleSignInButton
              onClick={onSignIn}
              disabled={loading}
              label={
                loading
                  ? lang === 'bn'
                    ? 'সংযুক্ত হচ্ছে...'
                    : 'Connecting...'
                  : lang === 'bn'
                  ? 'Gmail (Google) দিয়ে লগইন করুন'
                  : 'Continue with Google'
              }
            />

            <BounceButton
              onClick={onSkip}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-sky-100/60 dark:hover:bg-white/[0.06] flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
              <span>{tr(lang, 'continueOffline')}</span>
            </BounceButton>
          </div>
        </div>
      </div>
    </ModalSheet>
  );
};
