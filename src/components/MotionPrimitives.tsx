import React, { useEffect, useRef, useState } from 'react';
import { playFeedback } from '../utils/storage';

export const SPRING_BOUNCE = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 22,
  mass: 0.72,
};

export const SPRING_SMOOTH = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 28,
};

interface BounceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  sound?: 'click' | 'success' | 'none';
  bounceScale?: number;
}

export const BounceButton: React.FC<BounceButtonProps> = ({
  children,
  onClick,
  sound = 'click',
  bounceScale: _bounceScale,
  className = '',
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={(e) => {
        try {
          if (sound !== 'none') playFeedback(sound);
        } catch {
          // ignore audio failure
        }
        onClick?.(e);
      }}
      className={`cursor-pointer select-none transition-transform duration-150 ease-out hover:scale-[1.015] active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677E8] dark:focus-visible:ring-[#B8EE24] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#090A0D] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

interface AnimatedNumberProps {
  value: number;
  formatter: (n: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatter,
  className = '',
}) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = end;
    if (start === end) {
      setDisplay(end);
      return;
    }
    const duration = 520;
    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(p < 1 ? start + (end - start) * eased : end);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={`tabular-nums ${className}`}>{formatter(display)}</span>;
};

interface ModalSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  open,
  onClose,
  children,
  maxWidth = 'max-w-md',
  zIndex = 'z-50',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndex} bg-black/55 dark:bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4`}
    >
      <div
        className={`relative z-10 w-full ${maxWidth} animate-modal-in bg-white/95 dark:bg-[#14161D] backdrop-blur-2xl text-slate-950 dark:text-zinc-50 border border-sky-200/90 dark:border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-sky-200 dark:bg-white/20 mx-auto mt-3 mb-1" />
        {children}
      </div>
    </div>
  );
};
