import React from 'react';
import type { Language } from '../types/hisab';

interface FloatingExcelSaveProps {
  lang: Language;
  driveSyncing: boolean;
  excelDirty: boolean;
  isSaved: boolean;
  onSave: () => void;
}

/**
 * Compact glossy 3D capsule SAVE / SAVED pill that appears only when data is updated
 * (or actively saving / briefly confirming "Excel File Saved").
 */
export const FloatingExcelSave: React.FC<FloatingExcelSaveProps> = ({
  lang,
  driveSyncing,
  excelDirty,
  isSaved,
  onSave,
}) => {
  const showSavedState = !driveSyncing && !excelDirty && isSaved;

  const buttonLabel = driveSyncing
    ? 'SAVING...'
    : showSavedState
    ? 'SAVED'
    : 'SAVE';

  return (
    <div className="fixed bottom-[82px] right-3 md:bottom-5 md:right-5 z-40 flex flex-col items-end gap-1 select-none animate-modal-in">
      <div className="relative flex flex-col items-end">
        {(excelDirty || driveSyncing) && (
          <span className="pointer-events-none absolute -inset-0.5 rounded-full bg-sky-400/50 blur-sm animate-pulse" />
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={driveSyncing}
          aria-label={
            showSavedState
              ? 'Excel File Saved'
              : lang === 'bn'
              ? 'এক্সেলে সেভ করুন'
              : 'Save to Excel'
          }
          style={{
            background:
              'linear-gradient(180deg, #56D6FF 0%, #1CA3FF 44%, #0074F0 54%, #0054D1 100%)',
            boxShadow:
              '0 5px 14px rgba(0, 88, 224, 0.42), 0 1px 4px rgba(0, 50, 140, 0.3), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.78), inset 0 -2px 4px rgba(0, 42, 128, 0.45)',
          }}
          className="relative overflow-hidden h-[33px] pl-2 pr-3 rounded-full border-[1.5px] border-[#7CE3FF]/90 flex items-center gap-1.5 cursor-pointer disabled:cursor-wait transition-transform duration-150 hover:scale-105 active:scale-90"
        >
          {/* Upper glossy specular highlight reflection */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1.5 top-[1.5px] h-[44%] rounded-full bg-gradient-to-b from-white/75 via-white/30 to-transparent"
          />

          {/* Subtle glossy sheen */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-4 w-7 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />

          {/* Compact Dark Navy Floppy Disk + White-ringed Green Checkmark Badge SVG */}
          <div
            className={`relative w-[22px] h-[22px] shrink-0 flex items-center justify-center transition-transform duration-200 ${
              driveSyncing ? 'animate-pulse scale-105' : showSavedState ? 'scale-105' : ''
            }`}
          >
            <svg viewBox="0 0 42 40" className="w-[22px] h-[22px] drop-shadow-[0_1.5px_2px_rgba(0,22,70,0.45)]">
              <defs>
                <linearGradient id="floppyBodyGradSm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B4B9E" />
                  <stop offset="100%" stopColor="#0E2C66" />
                </linearGradient>
                <linearGradient id="greenBadgeGradSm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="55%" stopColor="#16A34A" />
                  <stop offset="100%" stopColor="#14532D" />
                </linearGradient>
              </defs>

              <path
                d="M2.5 4.5A2.5 2.5 0 0 1 5 2h22.5L34 8.5V33a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 33V4.5z"
                fill="url(#floppyBodyGradSm)"
              />
              <rect x="4" y="3.5" width="2" height="30" rx="1" fill="#60A5FA" opacity="0.45" />
              <rect x="9.5" y="2.5" width="15" height="10" rx="1.4" fill="#F0F7FF" />
              <rect x="19" y="4" width="3.4" height="7" rx="0.8" fill="#17418C" />
              <rect x="7" y="17.5" width="22.5" height="15" rx="2" fill="#E8F3FF" />
              <line x1="9.5" y1="21.5" x2="27" y2="21.5" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9.5" y1="26" x2="22" y2="26" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />

              <g transform="translate(22, 20)">
                <circle
                  cx="9"
                  cy="9"
                  r="8.8"
                  fill="url(#greenBadgeGradSm)"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                />
                {driveSyncing ? (
                  <circle
                    cx="9"
                    cy="9"
                    r="4.2"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeDasharray="16 8"
                  />
                ) : (
                  <path
                    d="M5.3 9.2l2.4 2.4 5-5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            </svg>
          </div>

          {/* Compact Bold White Label: SAVE / SAVING... / SAVED */}
          <span
            key={buttonLabel}
            className="relative z-10 text-white font-black tracking-[0.04em] text-[12px] leading-none drop-shadow-[0_1px_1.5px_rgba(0,30,95,0.55)]"
          >
            {buttonLabel}
          </span>
        </button>

        {/* Compact underneath caption: "Excel File Saved" when SAVED */}
        {showSavedState && (
          <div className="mt-0.5 px-2 py-[1px] rounded-full bg-emerald-600/95 dark:bg-emerald-500/95 text-white shadow-sm border border-emerald-300/60 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-extrabold tracking-wide whitespace-nowrap">
              Excel File Saved
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
