import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  BellRing,
  HandCoins,
  Moon,
  Plus,
  Printer,
  RotateCcw,
  Sun,
} from 'lucide-react';
import type {
  Language,
  PageKey,
  ThemeMode,
  Transaction,
  TxType,
  UserProfile,
} from './types/hisab';
import { ALL_CAT_NAMES, PROBASHI_GROUP_TITLE } from './data/categories';
import { tr } from './data/i18n';
import {
  DEFAULT_AVATAR,
  buildTextReport,
  cleanImportedTx,
  clearIdbMirror,
  hasPin,
  hashPin,
  loadFromIdbMirror,
  mirrorSaveToIdb,
  numParse,
  playFeedback,
  safeSave,
  todayIso,
  verifyPin,
} from './utils/storage';
import {
  downloadLocalXlsx,
  getAccessToken,
  parseXlsxBuffer,
  restoreFromGoogleDriveXlsx,
  signInWithGoogleWorkspace,
  signOutGoogle,
  subscribeAuth,
  syncAllToGoogleDrive,
} from './utils/googleDrive';
import { BrandLogo } from './components/BrandLogo';
import { CategoryIcon } from './components/CategoryIcon';
import { FloatingExcelSave } from './components/FloatingExcelSave';
import { SplashIntro } from './components/SplashIntro';
import { BounceButton, ModalSheet } from './components/MotionPrimitives';
import { HomeView } from './components/HomeView';
import { AccountsView } from './components/AccountsView';
import { SettingsView } from './components/SettingsView';
import { AddTxModal, CategoriesModal, DetailModal, PayModal } from './components/Modals';
import {
  LockScreen,
  PinDialog,
  ProfileModal,
  ReportModal,
  SaveFilesModal,
  VoucherModal,
} from './components/ExtraModals';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { LoansOverviewModal } from './components/LoansOverviewModal';

const VALID_CAT_SET = new Set(ALL_CAT_NAMES);
const VALID_LANGS = new Set<Language>(['bn', 'en', 'ar', 'zh']);
const VALID_THEMES = new Set<ThemeMode>(['light', 'dark', 'system']);
const VALID_TX_TYPES = new Set<TxType>(['income', 'expense', 'debt', 'paona']);

const getLS = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const setLS = (k: string, v: string): void => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // ignore
  }
};
const removeLS = (k: string): void => {
  try {
    localStorage.removeItem(k);
  } catch {
    // ignore
  }
};
const setSS = (k: string, v: string): void => {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    // ignore
  }
};

const TX_TYPE_MAP: Record<string, TxType> = {
  income: 'income',
  'আয়': 'income',
  'আয়': 'income',
  expense: 'expense',
  'ব্যয়': 'expense',
  'ব্যয়': 'expense',
  debt: 'debt',
  'ঋণ': 'debt',
  'দেনা': 'debt',
  'ঋণ নেওয়া': 'debt',
  'ঋণ নেওয়া': 'debt',
  paona: 'paona',
  'পাওনা': 'paona',
  'ঋণ দেওয়া': 'paona',
  'ঋণ দেওয়া': 'paona',
};

function sanitizeTxList(raw: unknown): Transaction[] {
  if (!Array.isArray(raw)) return [];
  const fallbackDate = todayIso();
  const out: Transaction[] = [];
  raw.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const x = entry as Record<string, unknown>;
    const amt = numParse((x.amount as string | number) ?? 0);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const rawTypeStr = String(x.type || 'expense').trim();
    const mappedType = TX_TYPE_MAP[rawTypeStr.toLowerCase()] || TX_TYPE_MAP[rawTypeStr];
    const ty: TxType = mappedType && VALID_TX_TYPES.has(mappedType) ? mappedType : 'expense';
    const rawDate = typeof x.date === 'string' ? x.date.trim() : '';
    const dt = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : fallbackDate;
    const parsedMonths = numParse((x.months as string | number) ?? 1);
    const reps = Array.isArray(x.repayments)
      ? x.repayments
          .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
          .map((r) => {
            const rAmt = numParse((r.amount as string | number) ?? 0);
            const rDateRaw = typeof r.date === 'string' ? r.date.trim() : '';
            return {
              amount: Number.isFinite(rAmt) ? rAmt : 0,
              date: /^\d{4}-\d{2}-\d{2}/.test(rDateRaw) ? rDateRaw.slice(0, 10) : dt,
            };
          })
          .filter((r) => r.amount > 0)
      : [];
    out.push({
      id: Number(x.id) || Date.now() + idx,
      category: typeof x.category === 'string' && x.category.trim() ? x.category : 'অন্যান্য',
      desc: typeof x.desc === 'string' ? x.desc : '',
      amount: amt,
      type: ty,
      months: Math.max(1, Math.round(Number.isFinite(parsedMonths) ? parsedMonths : 1)),
      person: typeof x.person === 'string' ? x.person : '',
      date: dt,
      voucher: typeof x.voucher === 'string' ? x.voucher : null,
      voucherId: typeof x.voucherId === 'string' ? x.voucherId : undefined,
      ts: Number(x.ts) || Date.now() + idx,
      repayments: reps,
    });
  });
  return out;
}

function loadInitialTransactions(): Transaction[] {
  try {
    const raw = JSON.parse(getLS('nex_transactions_2030') || '[]');
    const primary = sanitizeTxList(raw);
    if (primary.length > 0) return primary;
  } catch {
    // fallback to mirror below
  }
  try {
    const backup = JSON.parse(getLS('nex_transactions_backup_v1') || '[]');
    const restored = sanitizeTxList(backup);
    if (restored.length > 0) {
      safeSave('nex_transactions_2030', restored);
      return restored;
    }
  } catch {
    // ignore
  }
  return [];
}

function loadInitialProfile(): UserProfile {
  try {
    const raw = JSON.parse(getLS('nex_profile_2030') || 'null');
    if (raw && typeof raw === 'object') {
      return {
        name: typeof raw.name === 'string' ? raw.name : '',
        phone: typeof raw.phone === 'string' ? raw.phone : '',
        occupation: typeof raw.occupation === 'string' ? raw.occupation : '',
        email: typeof raw.email === 'string' ? raw.email : '',
        address: typeof raw.address === 'string' ? raw.address : '',
        bio: typeof raw.bio === 'string' ? raw.bio : '',
        photo: typeof raw.photo === 'string' && raw.photo ? raw.photo : DEFAULT_AVATAR,
      };
    }
  } catch {
    // ignore
  }
  return {
    name: '',
    phone: '',
    occupation: '',
    email: '',
    address: '',
    bio: '',
    photo: DEFAULT_AVATAR,
  };
}

export default function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [lang, setLang] = useState<Language>(() => {
    const saved = getLS('hd_lang') as Language | null;
    return saved && VALID_LANGS.has(saved) ? saved : 'bn';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = getLS('hd_theme') as ThemeMode | null;
    return saved && VALID_THEMES.has(saved) ? saved : 'dark';
  });
  const [resolvedDark, setResolvedDark] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<Transaction[]>(loadInitialTransactions);
  const [profile, setProfile] = useState<UserProfile>(loadInitialProfile);

  // Firebase / Google Workspace Auth & Drive State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(
    () => getLS('hd_last_drive_sync')
  );
  const [sheetUrl, setSheetUrl] = useState<string | null>(
    () => getLS('hd_last_sheet_url')
  );

  // Settings states
  const [soundOn, setSoundOn] = useState<boolean>(
    () => getLS('hd_sound') !== '0'
  );
  const [appLock, setAppLock] = useState<boolean>(
    () => getLS('hd_applock') === '1'
  );
  const [locked, setLocked] = useState<boolean>(
    () => getLS('hd_applock') === '1' && hasPin()
  );
  const [reminders, setReminders] = useState(() => ({
    kisti: getLS('hd_rem_kisti') === '1',
    paona: getLS('hd_rem_paona') === '1',
    dena: getLS('hd_rem_dena') === '1',
  }));
  const [defaultCat, setDefaultCat] = useState<string>(
    () => getLS('hd_defcat') || ''
  );
  const [monthlyBudget, setMonthlyBudget] = useState<number>(
    () => parseFloat(getLS('hd_budget') || '0') || 0
  );
  const [defaultMonths, setDefaultMonths] = useState<number>(
    () => parseInt(getLS('hd_defmonths') || '1', 10) || 1
  );
  const [reminderDays, setReminderDays] = useState<number>(
    () => parseInt(getLS('hd_remdays') || '3', 10) || 3
  );

  // Modals state
  const [addOpen, setAddOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [presetCat, setPresetCat] = useState('');
  const [presetType, setPresetType] = useState<TxType | ''>('');
  const [presetSeq, setPresetSeq] = useState(0);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesFocusGroup, setCategoriesFocusGroup] = useState<string | null>(null);
  const [loansOpen, setLoansOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [payModal, setPayModal] = useState<{ mode: 'debt' | 'paona'; person: string } | null>(
    null
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [saveFilesOpen, setSaveFilesOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [voucherSrc, setVoucherSrc] = useState<string | null>(null);

  // Confirm Dialog state (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // PIN flow dialog state (replaces window.prompt)
  const [pinFlow, setPinFlow] = useState<{
    step: 'verify-old' | 'new-pin' | 'confirm-pin' | 'disable-lock';
    tempPin?: string;
    onSuccess?: () => void;
  } | null>(null);

  // Toast, Undo & Auto-Excel Sync state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [undoItem, setUndoItem] = useState<{ tx: Transaction; idx: number } | null>(null);
  const undoTimer = useRef<number | null>(null);

  const txRef = useRef<Transaction[]>(transactions);
  const profileRef = useRef<UserProfile>(profile);
  txRef.current = transactions;
  profileRef.current = profile;

  const autoSyncTimer = useRef<number | null>(null);
  const savedHideTimer = useRef<number | null>(null);
  const [excelDirty, setExcelDirty] = useState(false);
  const [showSavedPill, setShowSavedPill] = useState(false);

  const flashSavedConfirmation = useCallback(() => {
    setShowSavedPill(true);
    if (savedHideTimer.current) window.clearTimeout(savedHideTimer.current);
    savedHideTimer.current = window.setTimeout(() => {
      setShowSavedPill(false);
    }, 3600);
  }, []);

  useEffect(() => {
    return () => {
      if (savedHideTimer.current) window.clearTimeout(savedHideTimer.current);
      if (autoSyncTimer.current) window.clearTimeout(autoSyncTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string, ms = 2400) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), ms);
  }, []);

  // Subscribe to Firebase Auth state & check IndexedDB mirror recovery on mount
  useEffect(() => {
    let active = true;
    if (txRef.current.length === 0) {
      void loadFromIdbMirror().then(({ transactions: idbTx, profile: idbProf }) => {
        if (!active) return;
        const recovered = sanitizeTxList(idbTx);
        if (recovered.length > 0 && txRef.current.length === 0) {
          txRef.current = recovered;
          setTransactions(recovered);
          safeSave('nex_transactions_2030', recovered);
          safeSave('nex_transactions_backup_v1', recovered);
          showToast(
            lang === 'bn'
              ? `${recovered.length}টি সংরক্ষিত লেনদেন পুনরুদ্ধার হয়েছে`
              : `Recovered ${recovered.length} saved transactions`,
            2800
          );
        }
        if (idbProf && !profileRef.current.name && idbProf.name) {
          profileRef.current = idbProf;
          setProfile(idbProf);
          safeSave('nex_profile_2030', idbProf);
        }
      });
    }

    const unsub = subscribeAuth((user) => {
      setGoogleUser(user);
      setAuthReady(true);
      if (user) {
        setProfile((prev) => {
          const updated: UserProfile = {
            ...prev,
            name: prev.name || user.displayName || '',
            email: prev.email || user.email || '',
            photo:
              prev.photo === DEFAULT_AVATAR && user.photoURL
                ? user.photoURL
                : prev.photo,
          };
          safeSave('nex_profile_2030', updated);
          return updated;
        });
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Theme application
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      setResolvedDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    setLS('hd_theme', theme);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  // Language & RTL sync
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    setLS('hd_lang', lang);
  }, [lang]);

  // Ensure an active Drive OAuth token (prompts Google Sign-In popup if token not in memory)
  const ensureToken = useCallback(async (): Promise<string | null> => {
    const existing = getAccessToken();
    if (existing) return existing;
    const { accessToken } = await signInWithGoogleWorkspace();
    return accessToken;
  }, []);

  const runDriveSync = useCallback(
    async (
      explicitToken?: string,
      opts?: {
        silent?: boolean;
        txOverride?: Transaction[];
        profileOverride?: UserProfile;
      }
    ): Promise<boolean> => {
      setDriveSyncing(true);
      try {
        const token = explicitToken || (await ensureToken());
        if (!token) {
          if (!opts?.silent) {
            showToast(
              lang === 'bn' ? 'Drive অনুমতি পাওয়া যায়নি' : 'Drive permission required',
              3000
            );
          }
          return false;
        }
        const txData = opts?.txOverride ?? txRef.current;
        const profData = opts?.profileOverride ?? profileRef.current;
        const res = await syncAllToGoogleDrive(token, txData, profData, lang);
        const nextSheetUrl = `https://docs.google.com/spreadsheets/d/${res.spreadsheetId}/edit`;
        setLS('hd_last_drive_sync', res.syncedAt);
        setLS('hd_last_sheet_url', nextSheetUrl);
        setLastDriveSync(res.syncedAt);
        setSheetUrl(nextSheetUrl);
        setExcelDirty(false);
        flashSavedConfirmation();
        playFeedback('excelSaved');
        if (!opts?.silent) {
          showToast(
            lang === 'bn'
              ? 'Excel File Saved — Google Sheet আপডেট হয়েছে!'
              : 'Excel File Saved & Google Sheet updated!',
            3200
          );
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Drive sync failed';
        if (!opts?.silent) {
          showToast(
            msg === 'AUTH_EXPIRED'
              ? lang === 'bn'
                ? 'আবার Google লগইন করুন'
                : 'Please sign in again'
              : msg.includes('popup-blocked')
              ? lang === 'bn'
                ? 'পপ-আপ ব্লক হয়েছে — ব্রাউজারে Allow করুন'
                : 'Popup blocked — please allow popups'
              : msg.includes('unauthorized-domain')
              ? lang === 'bn'
                ? 'এই লিঙ্কে Google পপ-আপ অনুমোদিত নয়'
                : 'Google sign-in unavailable on this domain'
              : msg,
            3500
          );
        }
        return false;
      } finally {
        setDriveSyncing(false);
      }
    },
    [ensureToken, flashSavedConfirmation, lang, showToast]
  );

  // Auto-save to Excel in Drive + mark pending Excel state (never overwrite Drive silently with empty array)
  const triggerAutoExcelSync = useCallback(
    (nextTx: Transaction[], nextProfile?: UserProfile) => {
      if (savedHideTimer.current) window.clearTimeout(savedHideTimer.current);
      setShowSavedPill(false);
      setExcelDirty(true);

      if (autoSyncTimer.current) window.clearTimeout(autoSyncTimer.current);
      autoSyncTimer.current = window.setTimeout(() => {
        const token = getAccessToken();
        if (token && nextTx.length > 0) {
          void runDriveSync(token, {
            silent: true,
            txOverride: nextTx,
            profileOverride: nextProfile ?? profileRef.current,
          });
        }
      }, 900);
    },
    [runDriveSync]
  );

  // Persist transactions to primary LS + backup LS + IndexedDB and auto-trigger Excel sync
  const persistTx = useCallback(
    (next: Transaction[], skipAutoSync = false): boolean => {
      const ok = safeSave('nex_transactions_2030', next);
      if (ok) {
        txRef.current = next;
        setTransactions(next);
        if (next.length > 0) {
          safeSave('nex_transactions_backup_v1', next);
          void mirrorSaveToIdb(next, profileRef.current);
        }
        if (!skipAutoSync) {
          triggerAutoExcelSync(next);
        }
      }
      return ok;
    },
    [triggerAutoExcelSync]
  );

  const restoreCleanedDriveData = useCallback(
    (restored: { transactions: unknown[]; profile?: Partial<UserProfile> }) => {
      const cleaned = restored.transactions
        .map((item, i) => cleanImportedTx(item, i, VALID_CAT_SET))
        .filter((x): x is Transaction => x !== null);
      if (cleaned.length > 0) {
        persistTx(cleaned, true);
      }
      if (restored.profile && typeof restored.profile === 'object') {
        const p = restored.profile;
        const nextP: UserProfile = {
          ...profileRef.current,
          name: String(p.name || profileRef.current.name || '').slice(0, 120),
          phone: String(p.phone || profileRef.current.phone || '').slice(0, 120),
          occupation: String(p.occupation || profileRef.current.occupation || '').slice(0, 120),
          email: String(p.email || profileRef.current.email || '').slice(0, 120),
          address: String(p.address || profileRef.current.address || '').slice(0, 120),
          bio: String(p.bio || profileRef.current.bio || '').slice(0, 120),
          photo:
            typeof p.photo === 'string' && p.photo.startsWith('data:image/')
              ? p.photo
              : profileRef.current.photo,
        };
        profileRef.current = nextP;
        setProfile(nextP);
        safeSave('nex_profile_2030', nextP);
        void mirrorSaveToIdb(cleaned.length > 0 ? cleaned : txRef.current, nextP);
      }
      setExcelDirty(false);
      return cleaned;
    },
    [persistTx]
  );

  const handleGoogleSignIn = async (): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setAuthModalOpen(false);
      setAuthError(null);
      showToast(
        lang === 'bn'
          ? `স্বাগতম, ${user.displayName || user.email}`
          : `Signed in as ${user.email}`
      );
      if (accessToken) {
        if (txRef.current.length === 0) {
          // CRITICAL: When local storage is empty, check & restore Drive backup FIRST so we never overwrite existing Drive records with []
          setDriveSyncing(true);
          try {
            const existingDrive = await restoreFromGoogleDriveXlsx(accessToken);
            if (existingDrive && Array.isArray(existingDrive.transactions) && existingDrive.transactions.length > 0) {
              const cleaned = restoreCleanedDriveData(existingDrive);
              if (cleaned.length > 0) {
                playFeedback('excelSaved');
                showToast(
                  lang === 'bn'
                    ? `${cleaned.length}টি আগের হিসাব Google Drive থেকে ফিরে এসেছে!`
                    : `Restored ${cleaned.length} entries from Google Drive!`,
                  3400
                );
                return true;
              }
            }
          } catch {
            // ignore restore probe errors
          } finally {
            setDriveSyncing(false);
          }
        } else {
          void runDriveSync(accessToken, {
            silent: false,
            txOverride: txRef.current,
            profileOverride: profileRef.current,
          });
        }
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      const friendly =
        msg.includes('popup-closed') || msg.includes('cancelled-popup-request')
          ? lang === 'bn'
            ? 'লগইন বাতিল করা হয়েছে'
            : 'Sign-in cancelled'
          : msg.includes('popup-blocked')
          ? lang === 'bn'
            ? 'পপ-আপ ব্লক হয়েছে — ব্রাউজারে পপ-আপ Allow করুন অথবা নতুন ট্যাবে খুলুন'
            : 'Popup blocked — allow popups or open app in a new tab'
          : msg.includes('unauthorized-domain')
          ? lang === 'bn'
            ? 'এই লিঙ্কে Google লগইন অনুমোদিত নয় — নতুন ট্যাবে খুলুন অথবা অফলাইনে ব্যবহার করুন'
            : 'Google Sign-In unavailable on this preview URL — open in a new tab or use offline'
          : msg;
      setAuthError(friendly);
      showToast(friendly, 3600);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogle();
    showToast(lang === 'bn' ? 'Google অ্যাকাউন্ট থেকে লগআউট হয়েছে' : 'Signed out of Google');
  };

  const saveLocalExcelWithFeedback = useCallback(
    (toastText: string) => {
      const ok = downloadLocalXlsx(txRef.current, profileRef.current, lang);
      const nowIso = new Date().toISOString();
      setLS('hd_last_drive_sync', nowIso);
      setLastDriveSync(nowIso);
      setExcelDirty(false);
      flashSavedConfirmation();
      playFeedback('excelSaved');
      if (!ok) {
        showToast(
          lang === 'bn'
            ? 'ডিভাইসে ফাইল ডাউনলোড ব্লক হয়েছে — ব্রাউজার সেটিংস দেখুন'
            : 'Browser blocked file download — check download permissions',
          3400
        );
        return;
      }
      showToast(toastText, 3200);
    },
    [flashSavedConfirmation, lang, showToast]
  );

  const handleManualExcelSave = async () => {
    playFeedback('savePress');
    if (autoSyncTimer.current) window.clearTimeout(autoSyncTimer.current);
    if (!googleUser) {
      saveLocalExcelWithFeedback(
        lang === 'bn'
          ? 'Excel (.xlsx) ফাইল সেভ হয়েছে!'
          : 'Excel (.xlsx) file saved!'
      );
      return;
    }
    const ok = await runDriveSync(undefined, {
      silent: false,
      txOverride: txRef.current,
      profileOverride: profileRef.current,
    });
    if (!ok) {
      saveLocalExcelWithFeedback(
        lang === 'bn'
          ? 'ডিভাইসে Excel (.xlsx) ফাইল সেভ হয়েছে!'
          : 'Saved Excel (.xlsx) file locally!'
      );
    }
  };

  const handleRequestDriveSync = () => {
    setConfirmState({
      title: tr(lang, 'driveSyncNow'),
      message: tr(lang, 'confirmDriveSync'),
      confirmLabel: tr(lang, 'save'),
      tone: 'primary',
      onConfirm: () => {
        setConfirmState(null);
        void runDriveSync();
      },
    });
  };

  const executeDriveRestore = useCallback(async () => {
    setDriveSyncing(true);
    try {
      const token = await ensureToken();
      if (!token) return;
      const restored = await restoreFromGoogleDriveXlsx(token);
      if (!restored || !Array.isArray(restored.transactions) || restored.transactions.length === 0) {
        showToast(
          lang === 'bn'
            ? 'Google Drive-এ কোনো আগের ব্যাকআপ ফাইল পাওয়া যায়নি'
            : 'No previous backup found in Google Drive',
          3200
        );
        return;
      }
      const cleaned = restoreCleanedDriveData(restored);
      playFeedback('success');
      showToast(
        lang === 'bn'
          ? `${cleaned.length}টি লেনদেন Google Drive থেকে রিস্টোর হয়েছে`
          : `Restored ${cleaned.length} entries from Google Drive`,
        3200
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
      showToast(msg, 3500);
    } finally {
      setDriveSyncing(false);
    }
  }, [ensureToken, lang, restoreCleanedDriveData, showToast]);

  const handleRequestDriveRestore = () => {
    if (txRef.current.length === 0) {
      void executeDriveRestore();
      return;
    }
    setConfirmState({
      title: tr(lang, 'driveRestoreNow'),
      message:
        lang === 'bn'
          ? 'Google Drive-এর ব্যাকআপ ("Takar-Hisab.xlsx" বা আগের Google Sheet) থেকে সব লেনদেন রিস্টোর করবেন? এটি বর্তমান ডিভাইসের লেনদেনের স্থলে বসবে।'
          : 'Restore all transactions from Google Drive backup? This will replace current entries.',
      confirmLabel: tr(lang, 'restore'),
      tone: 'primary',
      onConfirm: async () => {
        setConfirmState(null);
        await executeDriveRestore();
      },
    });
  };

  // Handlers
  const handleQuickToggleTheme = () => {
    const next: ThemeMode = resolvedDark ? 'light' : 'dark';
    setTheme(next);
    showToast(next === 'dark' ? tr(lang, 'stDark') : tr(lang, 'stLight'));
  };

  const handleOpenAdd = (cat?: string, ty?: TxType) => {
    if (cat === 'ঋণ পরিশোধ' || cat === 'পাওনা আদায়') {
      setCategoriesOpen(false);
      setLoansOpen(true);
      return;
    }
    setEditingTx(null);
    setPresetCat(cat || '');
    setPresetType(ty || '');
    setPresetSeq((s) => s + 1);
    setAddOpen(true);
  };

  const handleSaveTx = (tx: Transaction, isEdit: boolean) => {
    const next = isEdit
      ? transactions.map((x) => (x.id === tx.id ? tx : x))
      : [tx, ...transactions];
    if (!persistTx(next)) {
      showToast(
        lang === 'bn'
          ? 'স্টোরেজ পূর্ণ — ছবি বাদ দিয়ে চেষ্টা করুন'
          : 'Storage full — try without photo',
        3500
      );
      return;
    }
    setAddOpen(false);
    setEditingTx(null);
    if (!googleUser) {
      showToast(
        lang === 'bn'
          ? 'সংরক্ষিত! (Google Drive কানেক্ট করুন)'
          : 'Saved! (Connect Google Drive for backup)',
        3200
      );
    } else {
      showToast(tr(lang, 'saved'));
    }
  };

  const handleDeleteTx = (id: number) => {
    const idx = transactions.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const removed = transactions[idx];
    const next = transactions.filter((x) => x.id !== id);
    persistTx(next);
    playFeedback('click');
    setUndoItem({ tx: removed, idx });
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoItem(null), 5000);
  };

  const handleUndo = () => {
    if (!undoItem) return;
    const copy = transactions.slice();
    copy.splice(Math.min(undoItem.idx, copy.length), 0, undoItem.tx);
    persistTx(copy);
    setUndoItem(null);
    playFeedback('success');
  };

  const handleApplyPay = (
    mode: 'debt' | 'paona',
    person: string,
    amt: number,
    date: string
  ) => {
    let left = amt;
    const next = transactions.map((x) => ({
      ...x,
      repayments: [...(x.repayments || [])],
    }));
    const targets = next
      .filter((x) => x.type === mode && (x.person || 'অজানা') === person)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    for (const d of targets) {
      if (left <= 0) break;
      const paid = d.repayments.reduce((a, r) => a + r.amount, 0);
      const rem = d.amount - paid;
      if (rem <= 0) continue;
      const p = Math.min(rem, left);
      d.repayments.push({ amount: p, date });
      left -= p;
    }
    persistTx(next);
    showToast(tr(lang, 'saved'));
  };

  const handleDeletePay = (txId: number, repIdx: number) => {
    const next = transactions.map((x) => {
      if (x.id !== txId) return x;
      const reps = [...(x.repayments || [])];
      reps.splice(repIdx, 1);
      return { ...x, repayments: reps };
    });
    persistTx(next);
    playFeedback('click');
  };

  const handleClearAll = () => {
    setConfirmState({
      title: tr(lang, 'clear'),
      message:
        lang === 'bn'
          ? 'সব লেনদেন মুছে ফেলবেন? আপনার প্রোফাইল সংরক্ষিত থাকবে।'
          : 'Delete all transactions? Your profile will be kept.',
      confirmLabel: tr(lang, 'del'),
      tone: 'danger',
      onConfirm: () => {
        removeLS('nex_transactions_backup_v1');
        void clearIdbMirror();
        persistTx([], true);
        setConfirmState(null);
        showToast(tr(lang, 'deletedMsg'));
      },
    });
  };

  const handleResetAll = () => {
    setConfirmState({
      title: tr(lang, 'stReset'),
      message:
        lang === 'bn'
          ? 'সব হিসাব, প্রোফাইল ও সেটিংস স্থায়ীভাবে মুছে যাবে।'
          : 'All transactions, profile, and settings will be permanently erased.',
      confirmLabel: tr(lang, 'del'),
      tone: 'danger',
      onConfirm: () => {
        [
          'nex_transactions_2030',
          'nex_transactions_backup_v1',
          'nex_profile_2030',
          'hd_pin',
          'hd_pinh',
          'hd_salt',
          'hd_applock',
          'hd_budget',
          'hd_defcat',
          'hd_defmonths',
          'hd_remdays',
          'hd_rem_kisti',
          'hd_rem_paona',
          'hd_rem_dena',
          'hd_sound',
          'hd_last_drive_sync',
          'hd_last_sheet_url',
        ].forEach((k) => removeLS(k));
        void clearIdbMirror();
        txRef.current = [];
        setTransactions([]);
        setProfile({
          name: '',
          phone: '',
          occupation: '',
          email: '',
          address: '',
          bio: '',
          photo: DEFAULT_AVATAR,
        });
        setAppLock(false);
        setLocked(false);
        setMonthlyBudget(0);
        setLastDriveSync(null);
        setSheetUrl(null);
        if (savedHideTimer.current) window.clearTimeout(savedHideTimer.current);
        setExcelDirty(false);
        setShowSavedPill(false);
        setConfirmState(null);
        showToast(tr(lang, 'deletedMsg'));
      },
    });
  };

  const handleExportXlsx = () => {
    const ok = downloadLocalXlsx(transactions, profile, lang);
    showToast(
      ok
        ? tr(lang, 'saved')
        : lang === 'bn'
        ? 'ফাইল ডাউনলোড ব্লক হয়েছে'
        : 'Download blocked'
    );
  };

  const handleExportJson = () => {
    try {
      const b = new Blob([JSON.stringify({ profile, transactions }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takar-hisab-backup-${todayIso()}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast(tr(lang, 'saved'));
    } catch {
      showToast(lang === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
    }
  };

  const handleExportTxt = () => {
    try {
      const b = new Blob([buildTextReport(transactions, profile)], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takar-hisab-${todayIso()}.txt`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast(tr(lang, 'saved'));
    } catch {
      showToast(lang === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে' : 'Download failed');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isExcel = /\.(xlsx|xls)$/i.test(f.name);
    const applyParsed = (parsed: { transactions?: unknown[]; profile?: Partial<UserProfile> } | null) => {
      const rawList = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.transactions)
        ? parsed.transactions
        : null;
      if (!rawList) throw new Error('Invalid');
      const cleaned = rawList
        .map((item: unknown, i: number) => cleanImportedTx(item, i, VALID_CAT_SET))
        .filter((x: Transaction | null): x is Transaction => x !== null);
      if (cleaned.length === 0) {
        showToast(lang === 'bn' ? 'ফাইলে কোনো বৈধ লেনদেন পাওয়া যায়নি' : 'No valid entries in file');
        return;
      }
      const applyRestore = () => {
        persistTx(cleaned);
        if (parsed && !Array.isArray(parsed) && parsed.profile && typeof parsed.profile === 'object') {
          const p = parsed.profile;
          const nextP: UserProfile = {
            ...profile,
            name: String(p.name || profile.name || '').slice(0, 120),
            phone: String(p.phone || profile.phone || '').slice(0, 120),
            occupation: String(p.occupation || profile.occupation || '').slice(0, 120),
            email: String(p.email || profile.email || '').slice(0, 120),
            address: String(p.address || profile.address || '').slice(0, 120),
            bio: String(p.bio || profile.bio || '').slice(0, 120),
            photo:
              typeof p.photo === 'string' && p.photo.startsWith('data:image/')
                ? p.photo
                : profile.photo,
          };
          setProfile(nextP);
          safeSave('nex_profile_2030', nextP);
        }
        setConfirmState(null);
        showToast(
          lang === 'bn'
            ? `${cleaned.length}টি লেনদেন রিস্টোর হয়েছে`
            : `Restored ${cleaned.length} entries`
        );
      };
      if (txRef.current.length === 0) {
        applyRestore();
      } else {
        setConfirmState({
          title: tr(lang, 'restore'),
          message:
            lang === 'bn'
              ? `${cleaned.length}টি লেনদেন রিস্টোর হবে। চালিয়ে যাবেন?`
              : `Restore ${cleaned.length} transactions? This replaces current entries.`,
          confirmLabel: tr(lang, 'restore'),
          tone: 'primary',
          onConfirm: applyRestore,
        });
      }
    };

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (isExcel) {
          const buf = ev.target?.result as ArrayBuffer;
          const parsed = parseXlsxBuffer(buf);
          applyParsed(parsed);
        } else {
          const parsed = JSON.parse(String(ev.target?.result || '{}'));
          applyParsed(parsed);
        }
      } catch {
        showToast(lang === 'bn' ? 'ফাইলটি পড়া যায়নি' : 'Invalid backup file');
      }
    };
    if (isExcel) {
      reader.readAsArrayBuffer(f);
    } else {
      reader.readAsText(f);
    }
    e.target.value = '';
  };

  // PIN Flow handler
  const handlePinConfirm = async (val: string) => {
    if (!pinFlow) return;
    if (pinFlow.step === 'verify-old') {
      if (!(await verifyPin(val))) {
        showToast(lang === 'bn' ? 'ভুল PIN!' : 'Wrong PIN!');
        return;
      }
      setPinFlow({ step: 'new-pin', onSuccess: pinFlow.onSuccess });
      return;
    }
    if (pinFlow.step === 'new-pin') {
      if (!/^\d{4}$/.test(val)) {
        showToast(lang === 'bn' ? 'PIN অবশ্যই ৪ ডিজিটের' : 'PIN must be 4 digits');
        return;
      }
      setPinFlow({ step: 'confirm-pin', tempPin: val, onSuccess: pinFlow.onSuccess });
      return;
    }
    if (pinFlow.step === 'confirm-pin') {
      if (val !== pinFlow.tempPin) {
        showToast(lang === 'bn' ? 'PIN মেলেনি' : 'PINs did not match');
        setPinFlow(null);
        return;
      }
      const hashed = await hashPin(val);
      setLS('hd_pinh', hashed);
      removeLS('hd_pin');
      pinFlow.onSuccess?.();
      setPinFlow(null);
      showToast(tr(lang, 'saved'));
      return;
    }
    if (pinFlow.step === 'disable-lock') {
      if (!(await verifyPin(val))) {
        showToast(lang === 'bn' ? 'ভুল PIN!' : 'Wrong PIN!');
        return;
      }
      setLS('hd_applock', '0');
      setAppLock(false);
      setPinFlow(null);
      showToast(tr(lang, 'saved'));
    }
  };

  const navItems: { id: PageKey; label: string; iconName: string }[] = useMemo(
    () => [
      { id: 'home', label: tr(lang, 'home'), iconName: 'house' },
      { id: 'hisab', label: tr(lang, 'accounts'), iconName: 'layers' },
      { id: 'settings', label: tr(lang, 'settings'), iconName: 'gear' },
    ],
    [lang]
  );

  return (
    <div className="min-h-screen flex flex-col text-slate-950 dark:text-zinc-50 ambient-aura transition-colors duration-300">
        {/* Clean 3-Zone Top Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-sky-200/75 dark:border-white/[0.08] bg-white/65 dark:bg-[#07080A]/55 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => {
                playFeedback('click');
                setPage('home');
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap shrink-0 cursor-pointer group"
            >
              <BrandLogo size="sm" />
              <span className="text-[11px] sm:text-sm font-extrabold tracking-tight text-slate-950 dark:text-white">
                Takar Hisab
              </span>
            </button>

            {/* Zone 2: Desktop Single-Line Text Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              {navItems.map((item) => {
                const active = page === item.id;
                return (
                  <BounceButton
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`relative px-2 py-1.5 whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'text-[#1677E8] dark:text-[#C4F135]'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-1 h-0.5 rounded-full bg-[#1677E8] dark:bg-[#C4F135]" />
                    )}
                  </BounceButton>
                );
              })}
            </nav>

            {/* Zone 3: Quick Actions (Loans, Drive Sync, Google Sheet, A4 Print, Theme, Language, Export, New Entry) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <BounceButton
                onClick={() => setLoansOpen(true)}
                aria-label={tr(lang, 'loansOverview')}
                title={tr(lang, 'loansOverview')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/85 dark:bg-white/[0.06] border border-sky-200/80 dark:border-white/10 flex items-center justify-center text-[#1677E8] dark:text-[#C4F135]"
              >
                <HandCoins className="w-4 h-4" />
              </BounceButton>

              <BounceButton
                onClick={() => {
                  if (googleUser) {
                    handleRequestDriveSync();
                  } else {
                    setAuthError(null);
                    setAuthModalOpen(true);
                  }
                }}
                aria-label={tr(lang, 'driveSave')}
                title={tr(lang, 'driveSave')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/85 dark:bg-white/[0.06] border border-sky-200/80 dark:border-white/10 flex items-center justify-center text-[#1677E8] dark:text-[#C4F135]"
              >
                <CategoryIcon name="cloud" className="w-4 h-4" />
              </BounceButton>

              {sheetUrl ? (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playFeedback('click')}
                  aria-label={lang === 'bn' ? 'গুগল শিট খুলুন' : 'Open Google Sheet'}
                  title={lang === 'bn' ? 'গুগল শিট খুলুন' : 'Open Google Sheet'}
                  className="h-8 w-8 sm:w-auto sm:h-10 sm:px-2.5 rounded-xl bg-emerald-50/95 dark:bg-emerald-500/15 border border-emerald-400/70 dark:border-emerald-400/35 flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100/90 dark:hover:bg-emerald-500/25 active:scale-95 transition shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#0F9D58" />
                    <path d="M14 2v6h6z" fill="#87CEAC" />
                    <rect x="7" y="11" width="10" height="7" rx="0.8" fill="#FFFFFF" />
                    <line x1="7" y1="14.5" x2="17" y2="14.5" stroke="#0F9D58" strokeWidth="1.2" />
                    <line x1="11.5" y1="11" x2="11.5" y2="18" stroke="#0F9D58" strokeWidth="1.2" />
                  </svg>
                  <span className="hidden lg:inline whitespace-nowrap">
                    {lang === 'bn' ? 'গুগল শিট খুলুন' : 'Google Sheet'}
                  </span>
                </a>
              ) : (
                <BounceButton
                  onClick={() => {
                    if (!googleUser) {
                      setAuthError(null);
                      setAuthModalOpen(true);
                      return;
                    }
                    showToast(
                      lang === 'bn'
                        ? 'Google Sheet তৈরি হচ্ছে — সম্পন্ন হলেই সরাসরি খুলতে পারবেন'
                        : 'Creating Google Sheet — click again once saved',
                      3200
                    );
                    void handleManualExcelSave();
                  }}
                  aria-label={lang === 'bn' ? 'গুগল শিট খুলুন' : 'Open Google Sheet'}
                  title={lang === 'bn' ? 'গুগল শিট খুলুন' : 'Open Google Sheet'}
                  className="h-8 w-8 sm:w-auto sm:h-10 sm:px-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-500/12 border border-emerald-300/75 dark:border-emerald-400/30 flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#0F9D58" />
                    <path d="M14 2v6h6z" fill="#87CEAC" />
                    <rect x="7" y="11" width="10" height="7" rx="0.8" fill="#FFFFFF" />
                    <line x1="7" y1="14.5" x2="17" y2="14.5" stroke="#0F9D58" strokeWidth="1.2" />
                    <line x1="11.5" y1="11" x2="11.5" y2="18" stroke="#0F9D58" strokeWidth="1.2" />
                  </svg>
                  <span className="hidden lg:inline whitespace-nowrap">
                    {lang === 'bn' ? 'গুগল শিট খুলুন' : 'Google Sheet'}
                  </span>
                </BounceButton>
              )}

              <BounceButton
                onClick={() => setReportOpen(true)}
                aria-label={tr(lang, 'report')}
                title={tr(lang, 'report')}
                className="flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/85 dark:bg-white/[0.06] border border-sky-200/80 dark:border-white/10 items-center justify-center text-slate-700 dark:text-zinc-200"
              >
                <Printer className="w-4 h-4" />
              </BounceButton>

              <BounceButton
                onClick={handleQuickToggleTheme}
                aria-label={tr(lang, 'stAppear')}
                title={tr(lang, 'stAppear')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/85 dark:bg-white/[0.06] border border-sky-200/80 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-[#C4F135]"
              >
                <span className="inline-flex">
                  {resolvedDark ? (
                    <Sun className="w-4 h-4 fill-current" />
                  ) : (
                    <Moon className="w-4 h-4 fill-current" />
                  )}
                </span>
              </BounceButton>

              <BounceButton
                onClick={() => setSaveFilesOpen(true)}
                aria-label={tr(lang, 'saveFileT')}
                title={tr(lang, 'saveFileT')}
                className="hidden sm:flex w-10 h-10 rounded-xl bg-white/85 dark:bg-white/[0.06] border border-sky-200/80 dark:border-white/10 items-center justify-center text-slate-700 dark:text-zinc-200"
              >
                <CategoryIcon name="file-invoice" className="w-4 h-4" />
              </BounceButton>

              <select
                aria-label={tr(lang, 'language')}
                value={lang}
                onChange={(e) => {
                  setLang(e.target.value as Language);
                  showToast(tr(e.target.value as Language, 'saved'));
                }}
                className="h-8 sm:h-10 px-1.5 sm:px-2.5 rounded-xl bg-white/85 dark:bg-[#171A23] border border-sky-200/80 dark:border-white/15 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-zinc-100 cursor-pointer"
              >
                <option value="bn">BN</option>
                <option value="en">EN</option>
                <option value="ar">AR</option>
                <option value="zh">ZH</option>
              </select>

              <BounceButton
                onClick={() => handleOpenAdd()}
                className="hidden md:flex h-10 px-4 rounded-xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{tr(lang, 'newE')}</span>
              </BounceButton>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
          {/* Persistent Reminder Banner when Google Drive is NOT connected */}
          {authReady && !googleUser && !locked && (
            <div
              className="mb-4 rounded-2xl px-4 py-2.5 bg-amber-50/95 dark:bg-amber-500/12 border border-amber-300/80 dark:border-amber-400/30 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <BellRing className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-amber-950 dark:text-amber-200 truncate">
                    {lang === 'bn'
                      ? 'Google Drive সংযুক্ত নয়!'
                      : 'Google Drive not connected!'}
                  </p>
                  <p className="text-[11px] text-amber-800/85 dark:text-amber-300/80 truncate">
                    {lang === 'bn'
                      ? 'আপনার হিসাব Excel ফাইলে সেভ রাখতে Gmail দিয়ে কানেক্ট করুন।'
                      : 'Connect Gmail to safely store your Excel ledger in Google Drive.'}
                  </p>
                </div>
              </div>
              <BounceButton
                onClick={() => {
                  setAuthError(null);
                  setAuthModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white dark:bg-[#C4F135] dark:text-zinc-950 text-[11px] font-bold whitespace-nowrap shrink-0"
              >
                {lang === 'bn' ? 'কানেক্ট করুন' : 'Connect'}
              </BounceButton>
            </div>
          )}

          <div key={page}>
              {page === 'home' && (
                <HomeView
                  lang={lang}
                  isDark={resolvedDark}
                  profile={profile}
                  transactions={transactions}
                  googleUserEmail={googleUser?.email || null}
                  lastDriveSync={lastDriveSync}
                  driveSyncing={driveSyncing}
                  onOpenProfile={() => setProfileOpen(true)}
                  onOpenCategories={() => {
                    setCategoriesFocusGroup(null);
                    setCategoriesOpen(true);
                  }}
                  onOpenProbashi={() => {
                    setCategoriesFocusGroup(PROBASHI_GROUP_TITLE);
                    setCategoriesOpen(true);
                  }}
                  onQuickAdd={handleOpenAdd}
                  onGoAccounts={() => setPage('hisab')}
                  onOpenLoansOverview={() => setLoansOpen(true)}
                  onTriggerDriveSync={handleRequestDriveSync}
                  onTriggerDriveRestore={handleRequestDriveRestore}
                  onImportBackupFile={handleImportJson}
                  onOpenGoogleLogin={() => {
                    setAuthError(null);
                    setAuthModalOpen(true);
                  }}
                />
              )}

              {page === 'hisab' && (
                <AccountsView
                  lang={lang}
                  transactions={transactions}
                  monthlyBudget={monthlyBudget}
                  reminderDays={reminderDays}
                  remindersEnabled={reminders}
                  onOpenAdd={handleOpenAdd}
                  onOpenCategories={() => {
                    setCategoriesFocusGroup(null);
                    setCategoriesOpen(true);
                  }}
                  onOpenDetail={(tx) => setDetailTx(tx)}
                  onOpenRepay={(person) => setPayModal({ mode: 'debt', person })}
                  onOpenCollect={(person) => setPayModal({ mode: 'paona', person })}
                  onOpenLoansOverview={() => setLoansOpen(true)}
                  onClearAll={handleClearAll}
                  onQuickRestoreDrive={() => {
                    if (googleUser) {
                      handleRequestDriveRestore();
                    } else {
                      setAuthError(null);
                      setAuthModalOpen(true);
                    }
                  }}
                />
              )}

              {page === 'settings' && (
                <SettingsView
                  lang={lang}
                  theme={theme}
                  profile={profile}
                  googleUserEmail={googleUser?.email || null}
                  lastDriveSync={lastDriveSync}
                  driveSyncing={driveSyncing}
                  soundOn={soundOn}
                  appLock={appLock}
                  reminders={reminders}
                  defaultCat={defaultCat}
                  monthlyBudget={monthlyBudget}
                  defaultMonths={defaultMonths}
                  reminderDays={reminderDays}
                  onSetTheme={(th) => {
                    setTheme(th);
                    showToast(tr(lang, 'saved'));
                  }}
                  onSetLanguage={(l) => {
                    setLang(l);
                    showToast(tr(l, 'saved'));
                  }}
                  onOpenProfile={() => setProfileOpen(true)}
                  onGoogleSignIn={handleGoogleSignIn}
                  onGoogleSignOut={handleGoogleSignOut}
                  onDriveSync={handleRequestDriveSync}
                  onDriveRestore={handleRequestDriveRestore}
                  onExportXlsx={handleExportXlsx}
                  onToggleSound={(val) => {
                    setSoundOn(val);
                    setLS('hd_sound', val ? '1' : '0');
                    if (val) playFeedback('excelSaved');
                    showToast(tr(lang, 'saved'));
                  }}
                  onToggleReminder={(k, val) => {
                    const keyMap = {
                      kisti: 'hd_rem_kisti',
                      paona: 'hd_rem_paona',
                      dena: 'hd_rem_dena',
                    };
                    setLS(keyMap[k], val ? '1' : '0');
                    setReminders((prev) => ({ ...prev, [k]: val }));
                    showToast(tr(lang, 'saved'));
                  }}
                  onToggleAppLock={(val) => {
                    if (val) {
                      if (!hasPin()) {
                        setPinFlow({
                          step: 'new-pin',
                          onSuccess: () => {
                            setLS('hd_applock', '1');
                            setAppLock(true);
                          },
                        });
                      } else {
                        setLS('hd_applock', '1');
                        setAppLock(true);
                        showToast(tr(lang, 'saved'));
                      }
                    } else {
                      setPinFlow({ step: 'disable-lock' });
                    }
                  }}
                  onChangePin={() =>
                    setPinFlow({ step: hasPin() ? 'verify-old' : 'new-pin' })
                  }
                  onSaveAccounting={(cfg) => {
                    if (cfg.defaultCat !== undefined) {
                      setDefaultCat(cfg.defaultCat);
                      setLS('hd_defcat', cfg.defaultCat);
                    }
                    if (cfg.monthlyBudget !== undefined) {
                      setMonthlyBudget(cfg.monthlyBudget);
                      setLS('hd_budget', String(cfg.monthlyBudget));
                    }
                    if (cfg.defaultMonths !== undefined) {
                      setDefaultMonths(cfg.defaultMonths);
                      setLS('hd_defmonths', String(cfg.defaultMonths));
                    }
                    if (cfg.reminderDays !== undefined) {
                      setReminderDays(cfg.reminderDays);
                      setLS('hd_remdays', String(cfg.reminderDays));
                    }
                    showToast(tr(lang, 'saved'));
                  }}
                  onExportJson={handleExportJson}
                  onExportTxt={handleExportTxt}
                  onImportJson={handleImportJson}
                  onOpenReport={() => setReportOpen(true)}
                  onOpenSaveFiles={() => setSaveFilesOpen(true)}
                  onResetAll={handleResetAll}
                />
              )}
          </div>

          {/* Subtle Creator Attribution Footer */}
          <footer className="pt-4 pb-1 text-center">
            <p className="text-[11px] font-medium tracking-wide text-slate-500/80 dark:text-zinc-500">
              Developed by <span className="font-bold text-slate-700 dark:text-zinc-300">MD IMAM HOSSAIN</span>
            </p>
          </footer>
        </main>

        {/* Mobile Floating Bottom Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(8px+env(safe-area-inset-bottom,0px))] pt-1.5 bg-white/80 dark:bg-[#0E1015]/90 backdrop-blur-xl border-t border-sky-200/80 dark:border-white/[0.08]">
          <div className="max-w-md mx-auto grid grid-cols-4 items-center gap-1">
            {navItems.slice(0, 2).map((item) => {
              const active = page === item.id;
              return (
                <BounceButton
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  bounceScale={0.88}
                  className={`relative min-h-[44px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active
                      ? 'text-[#1677E8] dark:text-[#C4F135]'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-x-2 inset-y-0.5 rounded-2xl bg-sky-100/90 dark:bg-white/[0.08]" />
                  )}
                  <CategoryIcon name={item.iconName} className="w-5 h-5 relative z-10" />
                  <span className="text-[10px] font-bold relative z-10 whitespace-nowrap">
                    {item.label}
                  </span>
                </BounceButton>
              );
            })}

            {/* Center Primary Action Bounce Button */}
            <div className="flex justify-center">
              <BounceButton
                onClick={() => handleOpenAdd()}
                bounceScale={0.85}
                aria-label={tr(lang, 'newE')}
                className="w-12 h-12 -mt-5 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 flex items-center justify-center shadow-lg shadow-sky-600/25 dark:shadow-[0_8px_24px_rgba(196,241,53,0.35)]"
              >
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </BounceButton>
            </div>

            {(() => {
              const item = navItems[2];
              const active = page === item.id;
              return (
                <BounceButton
                  onClick={() => setPage(item.id)}
                  bounceScale={0.88}
                  className={`relative min-h-[44px] py-1.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active
                      ? 'text-[#1677E8] dark:text-[#C4F135]'
                      : 'text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-x-2 inset-y-0.5 rounded-2xl bg-sky-100/90 dark:bg-white/[0.08]" />
                  )}
                  <CategoryIcon name={item.iconName} className="w-5 h-5 relative z-10" />
                  <span className="text-[10px] font-bold relative z-10 whitespace-nowrap">
                    {item.label}
                  </span>
                </BounceButton>
              );
            })()}
          </div>
        </nav>

        {/* Modals */}
        <GoogleAuthModal
          open={authModalOpen}
          lang={lang}
          loading={authLoading}
          authError={authError}
          onSignIn={handleGoogleSignIn}
          onSkip={() => {
            setAuthError(null);
            setSS('hd_auth_skipped', '1');
            setAuthModalOpen(false);
          }}
        />

        <LoansOverviewModal
          open={loansOpen}
          lang={lang}
          transactions={transactions}
          onClose={() => setLoansOpen(false)}
          onAddLoan={(cat, ty) => handleOpenAdd(cat, ty)}
          onOpenRepay={(person) => setPayModal({ mode: 'debt', person })}
          onOpenCollect={(person) => setPayModal({ mode: 'paona', person })}
        />

        <AddTxModal
          open={addOpen}
          lang={lang}
          transactions={transactions}
          editingTx={editingTx}
          presetCat={presetCat}
          presetType={presetType}
          presetSeq={presetSeq}
          defaultCat={defaultCat}
          defaultMonths={defaultMonths}
          onClose={() => {
            setAddOpen(false);
            setEditingTx(null);
            setPresetCat('');
            setPresetType('');
          }}
          onOpenCategories={(focus) => {
            setCategoriesFocusGroup(focus || null);
            setCategoriesOpen(true);
          }}
          onSave={handleSaveTx}
          onToast={showToast}
        />

        <CategoriesModal
          open={categoriesOpen}
          lang={lang}
          focusGroup={categoriesFocusGroup}
          onClose={() => {
            setCategoriesOpen(false);
            setCategoriesFocusGroup(null);
          }}
          onPick={(catName) => {
            setCategoriesOpen(false);
            setCategoriesFocusGroup(null);
            if (addOpen) {
              setPresetCat(catName);
              setPresetSeq((s) => s + 1);
            } else {
              handleOpenAdd(catName);
            }
          }}
        />

        <DetailModal
          tx={detailTx}
          lang={lang}
          onClose={() => setDetailTx(null)}
          onEdit={(tx) => {
            setEditingTx(tx);
            setAddOpen(true);
          }}
          onDelete={handleDeleteTx}
          onViewVoucher={(src) => setVoucherSrc(src)}
        />

        <PayModal
          mode={payModal?.mode || null}
          person={payModal?.person || null}
          transactions={transactions}
          lang={lang}
          onClose={() => setPayModal(null)}
          onApplyPay={handleApplyPay}
          onDeletePay={handleDeletePay}
          onToast={showToast}
        />

        <ProfileModal
          open={profileOpen}
          lang={lang}
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSave={(p) => {
            profileRef.current = p;
            setProfile(p);
            safeSave('nex_profile_2030', p);
            triggerAutoExcelSync(txRef.current, p);
            showToast(tr(lang, 'saved'));
          }}
        />

        <SaveFilesModal
          open={saveFilesOpen}
          lang={lang}
          sheetUrl={sheetUrl}
          onClose={() => setSaveFilesOpen(false)}
          onDriveSync={handleRequestDriveSync}
          onDownloadXlsx={handleExportXlsx}
          onDownloadTxt={handleExportTxt}
          onDownloadJson={handleExportJson}
          onPrintPdf={() => setReportOpen(true)}
        />

        <ReportModal
          open={reportOpen}
          lang={lang}
          profile={profile}
          transactions={transactions}
          onClose={() => setReportOpen(false)}
        />

        <VoucherModal src={voucherSrc} onClose={() => setVoucherSrc(null)} />

        {/* Confirmation Modal */}
        <ModalSheet
          open={!!confirmState}
          onClose={() => setConfirmState(null)}
          maxWidth="max-w-xs"
          zIndex="z-[90]"
        >
          {confirmState && (
            <div className="p-6 space-y-4 text-center">
              <h3 className="text-base font-extrabold">{confirmState.title}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                {confirmState.message}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <BounceButton
                  onClick={() => setConfirmState(null)}
                  className="py-2.5 rounded-xl bg-sky-100/80 dark:bg-white/[0.08] font-semibold text-xs"
                >
                  {tr(lang, 'cancel')}
                </BounceButton>
                <BounceButton
                  onClick={confirmState.onConfirm}
                  className={`py-2.5 rounded-xl font-bold text-xs ${
                    confirmState.tone === 'primary'
                      ? 'bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {confirmState.confirmLabel || tr(lang, 'del')}
                </BounceButton>
              </div>
            </div>
          )}
        </ModalSheet>

        {/* PIN Dialog */}
        <PinDialog
          open={!!pinFlow}
          title={
            pinFlow?.step === 'verify-old'
              ? lang === 'bn'
                ? 'বর্তমান PIN দিন'
                : 'Current PIN'
              : pinFlow?.step === 'new-pin'
              ? lang === 'bn'
                ? 'নতুন ৪ ডিজিটের PIN'
                : 'New 4-digit PIN'
              : pinFlow?.step === 'confirm-pin'
              ? lang === 'bn'
                ? 'PIN আবার লিখুন'
                : 'Confirm PIN'
              : lang === 'bn'
              ? 'বন্ধ করতে PIN দিন'
              : 'Enter PIN to disable'
          }
          onCancel={() => setPinFlow(null)}
          onConfirm={handlePinConfirm}
        />

        {/* Lock Screen */}
        <LockScreen
          open={locked}
          lang={lang}
          profile={profile}
          onUnlock={async (pin) => {
            const ok = await verifyPin(pin);
            if (ok) setLocked(false);
            return ok;
          }}
          onResetAll={handleResetAll}
        />

        {/* Toast & Undo Floating Banners */}
        {toastMsg && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[120] max-w-[92vw] text-center px-5 py-2.5 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 text-xs font-bold shadow-xl pointer-events-none animate-modal-in">
            {toastMsg}
          </div>
        )}

        {undoItem && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[125] px-4 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-zinc-900 border border-white/15 text-xs font-semibold shadow-2xl flex items-center gap-3 whitespace-nowrap animate-modal-in">
            <span>{tr(lang, 'deletedMsg')}</span>
            <BounceButton
              onClick={handleUndo}
              className="px-2.5 py-1 rounded-lg bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tr(lang, 'undo')}</span>
            </BounceButton>
          </div>
        )}

        {/* Glossy 3D Floating Excel SAVE / SAVED pill (visible only when updated, saving, or briefly confirming) */}
        {!locked && (excelDirty || driveSyncing || showSavedPill) && (
          <FloatingExcelSave
            lang={lang}
            driveSyncing={driveSyncing}
            excelDirty={excelDirty}
            isSaved={showSavedPill}
            onSave={() => {
              void handleManualExcelSave();
            }}
          />
        )}

        {/* Launch Fan-Spin Logo Animation */}
        <SplashIntro
          open={showSplash}
          lang={lang}
          onFinish={handleSplashFinish}
        />
    </div>
  );
}
