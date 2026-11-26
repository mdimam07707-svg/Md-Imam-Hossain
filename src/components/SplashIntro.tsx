import React, { useEffect, useId, useState } from 'react';
import type { Language } from '../types/hisab';

interface SplashIntroProps {
  open: boolean;
  lang: Language;
  onFinish: () => void;
}

const BRAND_WORDS = [
  { text: 'Takar', accent: false, startIdx: 0 },
  { text: 'Hisab', accent: true, startIdx: 5 },
];

export const SplashIntro: React.FC<SplashIntroProps> = ({
  open,
  lang,
  onFinish,
}) => {
  const uid = useId().replace(/:/g, '');
  const onFinishRef = React.useRef(onFinish);
  onFinishRef.current = onFinish;
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFading(false);
    const fadeTimer = window.setTimeout(() => setFading(true), 2150);
    const doneTimer = window.setTimeout(() => onFinishRef.current(), 2550);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-label="Takar Hisab"
      className={`fixed inset-0 z-[200] pointer-events-none flex flex-col items-center justify-center overflow-hidden select-none bg-[#EEF6FF] dark:bg-[#050807] transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Ambient Emerald + Sky Radial Aura */}
      <div className="absolute w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(134,227,125,0.44)_0%,rgba(22,119,232,0.18)_46%,transparent_72%)] dark:bg-[radial-gradient(circle,rgba(134,227,125,0.32)_0%,rgba(59,137,71,0.14)_48%,transparent_74%)] blur-2xl" />

      {/* Logo Stage */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
        {/* Rotating Orbital Dashed Ring */}
        <div className="animate-splash-orbit absolute inset-0 rounded-full border border-dashed border-emerald-500/45 dark:border-[#86E37D]/40 pointer-events-none" />

        {/* Expanding Pulse Ring when Center Taka Appears */}
        <div className="animate-splash-pulse absolute inset-6 rounded-full border-2 border-emerald-400/70 dark:border-[#86E37D]/70 pointer-events-none" />

        {/* Spinning 4-Petal Emerald Fan Blades */}
        <div className="absolute inset-3 animate-fan-spin will-change-transform">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_14px_30px_rgba(34,197,94,0.38)]"
          >
            <defs>
              <linearGradient id={`${uid}-fan-dark-tl`} x1="25" y1="15" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0C1710" />
                <stop offset="55%" stopColor="#265432" />
                <stop offset="100%" stopColor="#5BB963" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-bright-tl`} x1="16" y1="62" x2="96" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#86E37D" />
                <stop offset="55%" stopColor="#3B8947" />
                <stop offset="100%" stopColor="#0C1710" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-dark-tr`} x1="175" y1="25" x2="105" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5BB963" />
                <stop offset="55%" stopColor="#245230" />
                <stop offset="100%" stopColor="#0B150E" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-bright-tr`} x1="138" y1="16" x2="118" y2="96" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#86E37D" />
                <stop offset="55%" stopColor="#3B8947" />
                <stop offset="100%" stopColor="#0B150E" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-dark-br`} x1="175" y1="185" x2="105" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#08100B" />
                <stop offset="55%" stopColor="#224E2D" />
                <stop offset="100%" stopColor="#5BB963" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-bright-br`} x1="184" y1="138" x2="104" y2="118" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#86E37D" />
                <stop offset="55%" stopColor="#3B8947" />
                <stop offset="100%" stopColor="#09120C" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-dark-bl`} x1="25" y1="175" x2="95" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#080F0B" />
                <stop offset="60%" stopColor="#255331" />
                <stop offset="100%" stopColor="#5BB963" />
              </linearGradient>
              <linearGradient id={`${uid}-fan-bright-bl`} x1="62" y1="184" x2="82" y2="104" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#86E37D" />
                <stop offset="55%" stopColor="#3B8947" />
                <stop offset="100%" stopColor="#0B150E" />
              </linearGradient>
            </defs>

            <g>
              <path d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z" fill={`url(#${uid}-fan-dark-tl)`} />
              <path d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z" fill={`url(#${uid}-fan-bright-tl)`} />
            </g>
            <g transform="rotate(90 100 100)">
              <path d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z" fill={`url(#${uid}-fan-dark-tr)`} />
              <path d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z" fill={`url(#${uid}-fan-bright-tr)`} />
            </g>
            <g transform="rotate(180 100 100)">
              <path d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z" fill={`url(#${uid}-fan-dark-br)`} />
              <path d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z" fill={`url(#${uid}-fan-bright-br)`} />
            </g>
            <g transform="rotate(270 100 100)">
              <path d="M96 92 C98 52 72 22 54 14 C32 32 22 52 16 66 C48 44 74 62 88 94 Z" fill={`url(#${uid}-fan-dark-bl)`} />
              <path d="M16 66 C26 88 52 98 92 96 C78 66 54 44 16 66 Z" fill={`url(#${uid}-fan-bright-bl)`} />
            </g>
          </svg>
        </div>

        {/* Center Circular Medallion — rises and scales up in the center */}
        <div className="animate-splash-medallion absolute inset-3 pointer-events-none will-change-transform">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_6px_18px_rgba(10,17,13,0.45)]">
            <defs>
              <linearGradient id={`${uid}-splash-center`} x1="65" y1="100" x2="135" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#77D972" />
                <stop offset="48%" stopColor="#2F6E3D" />
                <stop offset="100%" stopColor="#0A110D" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="34" fill={`url(#${uid}-splash-center)`} stroke="#FFFFFF" strokeWidth="3.5" />
          </svg>
        </div>

        {/* Taka Symbol — pops up cleanly in the center of the medallion */}
        <div className="animate-splash-taka absolute inset-3 pointer-events-none flex items-center justify-center will-change-transform">
          <span
            className="text-4xl sm:text-[44px] font-extrabold text-white drop-shadow-[0_2px_12px_rgba(134,227,125,0.9)]"
            style={{ fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif" }}
          >
            ৳
          </span>
        </div>
      </div>

      {/* Staggered Motion Typography Below Logo */}
      <div className="mt-5 text-center px-6">
        <div className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-2">
          {BRAND_WORDS.map((word) => (
            <span
              key={word.text}
              className={
                word.accent
                  ? 'text-emerald-600 dark:text-[#86E37D]'
                  : 'text-slate-950 dark:text-white'
              }
            >
              {word.text.split('').map((ch, idx) => (
                <span
                  key={`${word.text}-${idx}`}
                  style={{ animationDelay: `${0.62 + (word.startIdx + idx) * 0.042}s` }}
                  className="animate-splash-char"
                >
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </div>

        <div className="animate-splash-line mx-auto mt-2.5 h-[3px] w-24 rounded-full bg-gradient-to-r from-emerald-500 via-[#86E37D] to-sky-500 dark:from-[#3B8947] dark:via-[#86E37D] dark:to-[#C4F135]" />

        <p className="animate-splash-subtitle mt-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-zinc-300">
          {lang === 'bn' ? 'স্মার্ট আয়-ব্যয় ও ঋণের হিসাব' : 'Smart Ledger & Loan Manager'}
        </p>
      </div>

      {/* Creator Signature */}
      <p className="animate-splash-credit absolute bottom-8 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        Developed by <span className="font-extrabold text-emerald-700 dark:text-[#86E37D]">MD IMAM HOSSAIN</span>
      </p>
    </div>
  );
};
