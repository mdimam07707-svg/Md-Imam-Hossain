import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown) {
    console.error('Takar Hisab UI Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#eaf3ff] dark:bg-[#0D111A] text-slate-900 dark:text-white gap-4">
          <h1 className="text-lg font-extrabold">Takar Hisab</h1>
          <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-xs leading-relaxed">
            এই অংশটি লোড হতে একটি অস্থায়ী সমস্যা হয়েছে। আপনার সব তথ্য নিরাপদ আছে।
          </p>
          {this.state.errorMessage && (
            <p className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 max-w-sm break-words">
              {this.state.errorMessage}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 rounded-xl bg-[#1677E8] text-white text-xs font-bold cursor-pointer"
            >
              ফিরে যান
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
            >
              রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
