import type { PeriodKey, PeriodSummary, PersonGroup, Transaction, TxType, UserProfile } from '../types/hisab';

export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a" x1="0" y1="0" x2="100" y2="100"><stop offset="0%" stop-color="#D4FF4D"/><stop offset="100%" stop-color="#7CB518"/></linearGradient></defs><rect width="100" height="100" fill="url(#a)"/><circle cx="50" cy="39" r="17" fill="#090A0D"/><path d="M20 88c0-21 14-31 30-31s30 10 30 31Z" fill="#090A0D"/></svg>'
  );

export function todayIso(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function isoOf(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function numParse(v: string | number): number {
  return parseFloat(
    String(v || '')
      .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
      .replace(/[,\s৳]/g, '')
  );
}

export function sumPay(x: Transaction): number {
  return (x.repayments || []).reduce((a, r) => a + r.amount, 0);
}

export function personGroups(transactions: Transaction[], type: 'debt' | 'paona'): PersonGroup[] {
  const m: Record<string, PersonGroup> = {};
  transactions
    .filter((x) => x.type === type)
    .forEach((x) => {
      const P = x.person || 'অজানা';
      if (!m[P]) {
        m[P] = { person: P, total: 0, monthly: 0, paid: 0, items: [] };
      }
      m[P].total += x.amount;
      m[P].monthly += x.amount - sumPay(x) > 0.001 ? x.amount / (x.months || 1) : 0;
      m[P].paid += sumPay(x);
      m[P].items.push(x);
    });
  return Object.values(m);
}

export function periodRange(k: PeriodKey): [Date, Date] {
  const now = new Date();
  if (k === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  let ay = now.getFullYear();
  if (now.getMonth() === 0) ay -= 1;
  if (k === 'h1') return [new Date(ay, 1, 1), new Date(ay, 7, 0)];
  if (k === 'h2') return [new Date(ay, 7, 1), new Date(ay + 1, 1, 0)];
  return [new Date(ay, 1, 1), new Date(ay + 1, 1, 0)];
}

export function currentHalf(): 'h1' | 'h2' {
  const m = new Date().getMonth();
  return m >= 1 && m <= 6 ? 'h1' : 'h2';
}

export function sumPeriod(transactions: Transaction[], k: PeriodKey): PeriodSummary {
  const [a, b] = periodRange(k);
  const sI = isoOf(a);
  const eI = isoOf(b);
  const inR = (d: string) => !!d && d >= sI && d <= eI;
  const r: PeriodSummary = {
    income: 0,
    expense: 0,
    debt: 0,
    repaid: 0,
    paona: 0,
    collected: 0,
    balance: 0,
  };
  transactions.forEach((t) => {
    if (inR(t.date)) {
      if (t.type === 'income') r.income += t.amount;
      else if (t.type === 'expense') r.expense += t.amount;
      else if (t.type === 'debt') r.debt += t.amount;
      else if (t.type === 'paona') r.paona += t.amount;
    }
    (t.repayments || []).forEach((p) => {
      if (inR(p.date)) {
        if (t.type === 'debt') r.repaid += p.amount;
        else if (t.type === 'paona') r.collected += p.amount;
      }
    });
  });
  r.balance = r.income + r.debt + r.collected - r.expense - r.paona - r.repaid;
  return r;
}

export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDate();
  d.setMonth(d.getMonth() + n, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return isoOf(d);
}

export function nextDue(x: Transaction): string | null {
  const n = x.months || 1;
  const per = x.amount / n;
  const k = Math.floor(sumPay(x) / per + 1e-9);
  return k >= n ? null : addMonths(x.date, k + 1);
}

export function safeSave(key: string, val: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch {
    return false;
  }
}

export function compressImage(file: File, maxDim: number, quality: number, cb: (dataUrl: string) => void): void {
  const r = new FileReader();
  r.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > h && w > maxDim) {
        h = Math.round(h * (maxDim / w));
        w = maxDim;
      } else if (h > maxDim) {
        w = Math.round(w * (maxDim / h));
        h = maxDim;
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')?.drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/jpeg', quality));
    };
    img.src = String(e.target?.result || '');
  };
  r.readAsDataURL(file);
}

let audioCtx: AudioContext | null = null;
let audioUnlockAttached = false;

function getOrCreateAudioCtx(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function attachAudioUnlock(): void {
  if (audioUnlockAttached || typeof window === 'undefined') return;
  audioUnlockAttached = true;
  const unlock = () => {
    const ctx = getOrCreateAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

if (typeof window !== 'undefined') {
  attachAudioUnlock();
}

function playFeedbackNodes(
  ctx: AudioContext,
  type: 'click' | 'success' | 'savePress' | 'excelSaved'
): void {
  const now = ctx.currentTime + 0.005;

  if (type === 'excelSaved') {
    // Rich ascending 4-note crystal bell chime (D5 -> F#5 -> A5 -> D6)
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      const start = now + idx * 0.065;
      const dur = idx === notes.length - 1 ? 0.38 : 0.24;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(idx === notes.length - 1 ? 0.24 : 0.19, start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
    return;
  }

  if (type === 'savePress') {
    // Crisp tactile 3D button press: warm pop + bright click
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(360, now);
    pop.frequency.exponentialRampToValueAtTime(165, now + 0.075);
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.linearRampToValueAtTime(0.26, now + 0.008);
    popGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.095);
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    pop.start(now);
    pop.stop(now + 0.11);

    const tick = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tick.type = 'triangle';
    tick.frequency.setValueAtTime(1180, now + 0.012);
    tickGain.gain.setValueAtTime(0.0001, now + 0.012);
    tickGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    tickGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.11);
    tick.connect(tickGain);
    tickGain.connect(ctx.destination);
    tick.start(now + 0.012);
    tick.stop(now + 0.12);
    return;
  }

  if (type === 'success') {
    const notes = [620, 930];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
    return;
  }

  // Crisp subtle UI click
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(540, now);
  o.frequency.exponentialRampToValueAtTime(340, now + 0.055);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.18, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, now + 0.07);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(now);
  o.stop(now + 0.085);
}

function safeGetLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLS(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    // ignore storage errors
  }
}

function safeRemoveLS(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function playFeedback(
  type: 'click' | 'success' | 'savePress' | 'excelSaved' = 'click'
): void {
  if (safeGetLS('hd_sound') === '0') return;
  try {
    if (type === 'excelSaved') {
      navigator.vibrate?.([14, 28, 22]);
    } else if (type === 'success') {
      navigator.vibrate?.([14, 28, 14]);
    } else if (type === 'savePress') {
      navigator.vibrate?.(12);
    } else {
      navigator.vibrate?.(8);
    }
  } catch {
    // ignore
  }
  try {
    const ctx = getOrCreateAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          playFeedbackNodes(ctx, type);
        })
        .catch(() => {});
    } else {
      playFeedbackNodes(ctx, type);
    }
  } catch {
    // ignore
  }
}

export async function hashPin(p: string): Promise<string> {
  try {
    let s = safeGetLS('hd_salt');
    if (!s) {
      s = [...crypto.getRandomValues(new Uint8Array(8))].join('');
      safeSetLS('hd_salt', s);
    }
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s + ':' + p));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'p:' + p;
  }
}

export function hasPin(): boolean {
  return !!(safeGetLS('hd_pinh') || safeGetLS('hd_pin'));
}

export async function verifyPin(p: string): Promise<boolean> {
  let h = safeGetLS('hd_pinh');
  const old = safeGetLS('hd_pin');
  if (!h && old) {
    h = await hashPin(old);
    safeSetLS('hd_pinh', h);
    safeRemoveLS('hd_pin');
  }
  return !!h && (await hashPin(p)) === h;
}

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

function parseIsoDate(d: unknown, fallback: string): string {
  if (typeof d !== 'string') return fallback;
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return fallback;
}

export function cleanImportedTx(raw: unknown, index: number, validCategories: Set<string>): Transaction | null {
  const a = raw as Record<string, unknown>;
  if (!a || typeof a !== 'object') return null;
  const S = (v: unknown) => String(v == null ? '' : v).slice(0, 200);
  const rawTypeKey = S(a.type).trim().toLowerCase();
  const resolvedType = TX_TYPE_MAP[rawTypeKey] || TX_TYPE_MAP[S(a.type).trim()];
  const n = numParse((a.amount as string | number) ?? 0);
  if (!resolvedType || !Number.isFinite(n) || !(n > 0)) return null;

  const fallback = todayIso();
  const dt = parseIsoDate(a.date, fallback);
  const cat = S(a.category).trim();
  const parsedMonths = numParse((a.months as string | number) ?? 1);
  return {
    id: Number(a.id) || Date.now() + index,
    category: cat || (validCategories.has('অন্যান্য') ? 'অন্যান্য' : 'অন্যান্য'),
    desc: S(a.desc),
    amount: n,
    type: resolvedType,
    months: Math.max(1, Math.round(Number.isFinite(parsedMonths) ? parsedMonths : 1)),
    person: S(a.person),
    date: dt,
    voucher: typeof a.voucher === 'string' && a.voucher.startsWith('data:image/') ? a.voucher : null,
    voucherId: typeof a.voucherId === 'string' && /^[\w-]+$/.test(a.voucherId) ? a.voucherId : undefined,
    ts: Number(a.ts) || Date.now() + index,
    repayments: (Array.isArray(a.repayments) ? a.repayments : [])
      .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
      .map((r) => ({
        amount: numParse((r.amount as string | number) ?? 0),
        date: parseIsoDate(r.date, dt),
      }))
      .filter((r) => Number.isFinite(r.amount) && r.amount > 0),
  };
}

/* ============ IndexedDB Secondary Local Backup Mirror ============ */
const IDB_NAME = 'takar_hisab_db';
const IDB_STORE = 'ledger_backup';

function openLedgerIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function mirrorSaveToIdb(
  transactions: Transaction[],
  profile?: UserProfile
): Promise<void> {
  try {
    const db = await openLedgerIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(transactions, 'transactions');
      if (profile) store.put(profile, 'profile');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore IndexedDB errors
  }
}

export async function loadFromIdbMirror(): Promise<{
  transactions: unknown[];
  profile: UserProfile | null;
}> {
  try {
    const db = await openLedgerIdb();
    if (!db) return { transactions: [], profile: null };
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const tReq = store.get('transactions');
      const pReq = store.get('profile');
      tx.oncomplete = () => {
        const txs = Array.isArray(tReq.result) ? tReq.result : [];
        const prof = pReq.result && typeof pReq.result === 'object' ? (pReq.result as UserProfile) : null;
        db.close();
        resolve({ transactions: txs, profile: prof });
      };
      tx.onerror = () => {
        db.close();
        resolve({ transactions: [], profile: null });
      };
    });
  } catch {
    return { transactions: [], profile: null };
  }
}

export async function clearIdbMirror(): Promise<void> {
  try {
    const db = await openLedgerIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
}

export function buildTextReport(transactions: Transaction[], profile: UserProfile): string {
  const L: string[] = [];
  const periods: [PeriodKey, string][] = [
    ['month', 'এই মাস'],
    [currentHalf(), currentHalf() === 'h1' ? 'ফেব্রুয়ারি–জুলাই (৬ মাস)' : 'আগস্ট–জানুয়ারি (৬ মাস)'],
    ['year', '১ বছর'],
  ];
  L.push('========== হিসাব — সম্পূর্ণ রিপোর্ট ==========');
  L.push(`নাম: ${profile.name || 'ব্যবহারকারী'}  |  তৈরি: ${new Date().toLocaleString('bn-BD')}`);
  L.push('');
  periods.forEach(([k, label]) => {
    const s = sumPeriod(transactions, k);
    L.push(`--- ${label} ---`);
    L.push(
      `আয়: ${s.income} | ব্যয়: ${s.expense} | ঋণ: ${s.debt} | পরিশোধ: ${s.repaid} | পাওনা: ${s.paona} | আদায়: ${s.collected} | ব্যালেন্স: ${s.balance}`
    );
  });
  L.push('');
  L.push('--- ঋণ ---');
  personGroups(transactions, 'debt').forEach((g) =>
    L.push(`${g.person}: মোট ${g.total} | মাসিক ${g.monthly.toFixed(0)} | পরিশোধিত ${g.paid} | বাকি ${g.total - g.paid}`)
  );
  L.push('');
  L.push('--- পাওনা ---');
  personGroups(transactions, 'paona').forEach((g) =>
    L.push(`${g.person}: পাওনা ${g.total} | মাসিক ${g.monthly.toFixed(0)} | আদায় ${g.paid} | বাকি ${g.total - g.paid}`)
  );
  L.push('');
  L.push('--- সব লেনদেন ---');
  transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((x) =>
      L.push(`${x.date} | ${x.type} | ${x.desc} | ${x.category}${x.person ? ' | ' + x.person : ''} | ${x.amount}`)
    );
  return L.join('\n');
}
