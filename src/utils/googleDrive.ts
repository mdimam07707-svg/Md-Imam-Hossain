import { initializeApp, getApps } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import * as XLSX from 'xlsx';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Language, Transaction, UserProfile } from '../types/hisab';
import { catLabel } from '../data/categories';
import { typeLabel } from '../data/i18n';
import { numParse, personGroups, sumPay, todayIso } from './storage';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Strictly in-memory OAuth access token (never written to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedTokenTime = 0;

export function getAccessToken(): string | null {
  // Google OAuth access tokens typically last 60 minutes; clear if older than 55m
  if (cachedAccessToken && Date.now() - cachedTokenTime > 55 * 60 * 1000) {
    cachedAccessToken = null;
  }
  return cachedAccessToken;
}

export function clearAccessToken(): void {
  cachedAccessToken = null;
  cachedTokenTime = 0;
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  try {
    return onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          clearAccessToken();
        }
        cb(user);
      },
      () => {
        clearAccessToken();
        cb(null);
      }
    );
  } catch {
    cb(null);
    return () => {};
  }
}

export async function signInWithGoogleWorkspace(): Promise<{
  user: User;
  accessToken: string | null;
}> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || null;
  if (token) {
    cachedAccessToken = token;
    cachedTokenTime = Date.now();
  }
  return { user: result.user, accessToken: token };
}

export async function signOutGoogle(): Promise<void> {
  clearAccessToken();
  await signOut(auth);
}

/* ============ Excel (.xlsx) Workbook Builder ============ */
export function buildWorkbook(
  transactions: Transaction[],
  profile: UserProfile,
  lang: Language = 'bn'
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: All Transactions (Master)
  const txRows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((x) => {
      const paid = x.type === 'debt' || x.type === 'paona' ? sumPay(x) : 0;
      const rem = x.type === 'debt' || x.type === 'paona' ? Math.max(0, x.amount - paid) : 0;
      return {
        ID: x.id,
        Date: x.date,
        Type: typeLabel(x.type, lang),
        TypeCode: x.type,
        Category: catLabel(x.category, lang),
        CategoryRaw: x.category,
        Description: x.desc,
        Person: x.person || '',
        Amount: x.amount,
        Months: x.months || 1,
        PaidOrCollected: paid,
        Remaining: rem,
      };
    });
  const wsMaster = XLSX.utils.json_to_sheet(
    txRows.length
      ? txRows
      : [
          {
            ID: '',
            Date: todayIso(),
            Type: '',
            TypeCode: '',
            Category: '',
            CategoryRaw: '',
            Description: 'No transactions yet',
            Person: '',
            Amount: 0,
            Months: 1,
            PaidOrCollected: 0,
            Remaining: 0,
          },
        ]
  );
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Transactions');

  // Sheet 2: ঋণ দেওয়া ও ঋণ নেওয়া (Loans Given & Taken)
  const loanGiven = personGroups(transactions, 'paona').map((g) => ({
    Direction: 'ঋণ দেওয়া (পাওনা)',
    Person: g.person,
    TotalAmount: g.total,
    RepaidOrCollected: g.paid,
    Remaining: Math.max(0, g.total - g.paid),
    MonthlyInstallment: Number(g.monthly.toFixed(2)),
  }));
  const loanTaken = personGroups(transactions, 'debt').map((g) => ({
    Direction: 'ঋণ নেওয়া (দেনা)',
    Person: g.person,
    TotalAmount: g.total,
    RepaidOrCollected: g.paid,
    Remaining: Math.max(0, g.total - g.paid),
    MonthlyInstallment: Number(g.monthly.toFixed(2)),
  }));
  const loanRows = [...loanGiven, ...loanTaken];
  const wsLoans = XLSX.utils.json_to_sheet(
    loanRows.length
      ? loanRows
      : [
          {
            Direction: 'ঋণ দেওয়া / নেওয়া',
            Person: '-',
            TotalAmount: 0,
            RepaidOrCollected: 0,
            Remaining: 0,
            MonthlyInstallment: 0,
          },
        ]
  );
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans_Given_Taken');

  // Sheet 3: Summary & Repayments
  let inc = 0;
  let exp = 0;
  let debt = 0;
  let repaid = 0;
  let paona = 0;
  let collected = 0;
  const repRows: Record<string, unknown>[] = [];
  transactions.forEach((t) => {
    if (t.type === 'income') inc += t.amount;
    else if (t.type === 'expense') exp += t.amount;
    else if (t.type === 'debt') {
      debt += t.amount;
      repaid += sumPay(t);
    } else if (t.type === 'paona') {
      paona += t.amount;
      collected += sumPay(t);
    }
    (t.repayments || []).forEach((r) => {
      repRows.push({
        TxID: t.id,
        Type: t.type === 'debt' ? 'ঋণ পরিশোধ' : 'পাওনা আদায়',
        Person: t.person || t.desc,
        Date: r.date,
        Amount: r.amount,
      });
    });
  });

  const summaryRows = [
    { Metric: 'Owner Name', Value: profile.name || 'User' },
    { Metric: 'Email', Value: profile.email || '' },
    { Metric: 'Updated At', Value: new Date().toISOString() },
    { Metric: 'Total Income (আয়)', Value: inc },
    { Metric: 'Total Expense (ব্যয়)', Value: exp },
    { Metric: 'Total Loan Given (ঋণ দেওয়া / পাওনা)', Value: paona },
    { Metric: 'Total Collected (পাওনা আদায়)', Value: collected },
    { Metric: 'Remaining Receivable (আদায় বাকি)', Value: Math.max(0, paona - collected) },
    { Metric: 'Total Loan Taken (ঋণ নেওয়া / দেনা)', Value: debt },
    { Metric: 'Total Repaid (ঋণ পরিশোধ)', Value: repaid },
    { Metric: 'Remaining Debt (পরিশোধ বাকি)', Value: Math.max(0, debt - repaid) },
    {
      Metric: 'Net Cash Balance (মোট ব্যালেন্স)',
      Value: inc + debt + collected - exp - paona - repaid,
    },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  if (repRows.length) {
    const wsRep = XLSX.utils.json_to_sheet(repRows);
    XLSX.utils.book_append_sheet(wb, wsRep, 'Repayments');
  }

  // Raw JSON backup sheet (hidden/structured for lossless Drive restore)
  const payload = JSON.stringify({ profile, transactions });
  const chunks: { ChunkIndex: number; Payload: string }[] = [];
  for (let i = 0; i < payload.length; i += 30000) {
    chunks.push({ ChunkIndex: chunks.length, Payload: payload.slice(i, i + 30000) });
  }
  const wsBackup = XLSX.utils.json_to_sheet(chunks);
  XLSX.utils.book_append_sheet(wb, wsBackup, 'Takar_Hisab_Data');

  return wb;
}

export function buildXlsxBlob(
  transactions: Transaction[],
  profile: UserProfile,
  lang: Language = 'bn'
): Blob {
  const wb = buildWorkbook(transactions, profile, lang);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadLocalXlsx(
  transactions: Transaction[],
  profile: UserProfile,
  lang: Language = 'bn'
): boolean {
  try {
    const blob = buildXlsxBlob(transactions, profile, lang);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Takar-Hisab-${todayIso()}.xlsx`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}

/* ============ Google Drive & Google Sheets Sync ============ */
const DRIVE_FOLDER_NAME = 'Takar Hisab';
const XLSX_FILE_NAME = 'Takar-Hisab.xlsx';
const SHEET_FILE_NAME = 'Takar-Hisab-Transactions';
const LEGACY_FOLDER_NAME = 'হিসাব (Hisab)';
const LEGACY_XLSX_NAME = 'Hisab-Ledger.xlsx';

async function driveFetch(url: string, token: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAccessToken();
    throw new Error('AUTH_EXPIRED');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Drive API error (${res.status}): ${txt.slice(0, 180)}`);
  }
  return res.json();
}

async function findFolderByName(token: string, folderName: string): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const list = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    token
  );
  return list.files?.[0]?.id || null;
}

async function ensureHisabFolder(token: string): Promise<string> {
  const existingId = await findFolderByName(token, DRIVE_FOLDER_NAME);
  if (existingId) return existingId;
  const created = await driveFetch('https://www.googleapis.com/drive/v3/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  return created.id as string;
}

async function findFileInFolder(
  token: string,
  folderId: string,
  name: string,
  mimeType?: string
): Promise<{ id: string; name: string; modifiedTime?: string } | null> {
  const parts = [`'${folderId}' in parents`, `name='${name}'`, 'trashed=false'];
  if (mimeType) parts.push(`mimeType='${mimeType}'`);
  const q = encodeURIComponent(parts.join(' and '));
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
    token
  );
  return res.files?.[0] || null;
}

async function uploadMultipartXlsx(
  token: string,
  folderId: string,
  existingFileId: string | null,
  blob: Blob
): Promise<{ id: string; webViewLink?: string }> {
  const boundary = 'hisab_xlsx_boundary_' + Date.now();
  const metadata = existingFileId
    ? { name: XLSX_FILE_NAME }
    : {
        name: XLSX_FILE_NAME,
        parents: [folderId],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

  const metaPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`;
  const fileHeader =
    `--${boundary}\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;

  const bodyBlob = new Blob([metaPart, fileHeader, blob, footer]);
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,webViewLink`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`;

  const res = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob,
  });
  if (res.status === 401) {
    clearAccessToken();
    throw new Error('AUTH_EXPIRED');
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Upload error (${res.status}): ${txt.slice(0, 160)}`);
  }
  return res.json();
}

async function ensureAndUpdateGoogleSheet(
  token: string,
  folderId: string,
  transactions: Transaction[],
  profile: UserProfile,
  lang: Language
): Promise<string> {
  const existing = await findFileInFolder(
    token,
    folderId,
    SHEET_FILE_NAME,
    'application/vnd.google-apps.spreadsheet'
  );

  let spreadsheetId = existing?.id || '';
  if (!spreadsheetId) {
    const created = await driveFetch('https://sheets.googleapis.com/v4/spreadsheets', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: SHEET_FILE_NAME },
        sheets: [
          { properties: { title: 'Transactions' } },
          { properties: { title: 'Loans_Given_Taken' } },
          { properties: { title: 'Summary' } },
        ],
      }),
    });
    spreadsheetId = created.spreadsheetId as string;
    // Move sheet into হিসাব (Hisab) folder
    await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id`,
      token,
      { method: 'PATCH' }
    );
  } else {
    // Ensure required tabs exist without hardcoding blind assumptions
    const meta = await driveFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      token
    );
    const existingTabs = new Set<string>(
      (meta.sheets || []).map((s: { properties?: { title?: string } }) => s.properties?.title || '')
    );
    const needed = ['Transactions', 'Loans_Given_Taken', 'Summary'].filter(
      (t) => !existingTabs.has(t)
    );
    if (needed.length > 0) {
      await driveFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: needed.map((title) => ({ addSheet: { properties: { title } } })),
          }),
        }
      );
    }
  }

  // Clear old ranges cleanly before updating
  await driveFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ranges: ['Transactions!A:Z', 'Loans_Given_Taken!A:Z', 'Summary!A:Z'],
      }),
    }
  );

  const txRows = [
    ['ID', 'Date', 'Type', 'Category', 'Description', 'Person', 'Amount', 'Months', 'Paid/Collected', 'Remaining'],
    ...transactions
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((x) => {
        const paid = x.type === 'debt' || x.type === 'paona' ? sumPay(x) : 0;
        const rem = x.type === 'debt' || x.type === 'paona' ? Math.max(0, x.amount - paid) : 0;
        return [
          x.id,
          x.date,
          typeLabel(x.type, lang),
          catLabel(x.category, lang),
          x.desc,
          x.person || '',
          x.amount,
          x.months || 1,
          paid,
          rem,
        ];
      }),
  ];

  const loanRows = [
    ['Direction', 'Person', 'Total Amount', 'Repaid / Collected', 'Remaining', 'Monthly Installment'],
    ...personGroups(transactions, 'paona').map((g) => [
      'ঋণ দেওয়া (পাওনা)',
      g.person,
      g.total,
      g.paid,
      Math.max(0, g.total - g.paid),
      Number(g.monthly.toFixed(2)),
    ]),
    ...personGroups(transactions, 'debt').map((g) => [
      'ঋণ নেওয়া (দেনা)',
      g.person,
      g.total,
      g.paid,
      Math.max(0, g.total - g.paid),
      Number(g.monthly.toFixed(2)),
    ]),
  ];

  let inc = 0;
  let exp = 0;
  let debt = 0;
  let repaid = 0;
  let paona = 0;
  let collected = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') inc += t.amount;
    else if (t.type === 'expense') exp += t.amount;
    else if (t.type === 'debt') {
      debt += t.amount;
      repaid += sumPay(t);
    } else if (t.type === 'paona') {
      paona += t.amount;
      collected += sumPay(t);
    }
  });

  const summaryRows = [
    ['Metric', 'Value'],
    ['Name', profile.name || 'User'],
    ['Email', profile.email || ''],
    ['Updated', new Date().toLocaleString()],
    ['Total Income', inc],
    ['Total Expense', exp],
    ['Loan Given (পাওনা)', paona],
    ['Loan Collected (আদায়)', collected],
    ['Loan Taken (ঋণ নেওয়া)', debt],
    ['Loan Repaid (পরিশোধ)', repaid],
    ['Net Balance', inc + debt + collected - exp - paona - repaid],
  ];

  await driveFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Transactions!A1', values: txRows },
          { range: 'Loans_Given_Taken!A1', values: loanRows },
          { range: 'Summary!A1', values: summaryRows },
        ],
      }),
    }
  );

  return spreadsheetId;
}

export interface DriveSyncResult {
  folderId: string;
  xlsxFileId: string;
  xlsxLink?: string;
  spreadsheetId: string;
  syncedAt: string;
}

export async function syncAllToGoogleDrive(
  token: string,
  transactions: Transaction[],
  profile: UserProfile,
  lang: Language
): Promise<DriveSyncResult> {
  const folderId = await ensureHisabFolder(token);
  const existingXlsx = await findFileInFolder(token, folderId, XLSX_FILE_NAME);
  const blob = buildXlsxBlob(transactions, profile, lang);
  const uploadedXlsx = await uploadMultipartXlsx(
    token,
    folderId,
    existingXlsx?.id || null,
    blob
  );
  const spreadsheetId = await ensureAndUpdateGoogleSheet(
    token,
    folderId,
    transactions,
    profile,
    lang
  );

  return {
    folderId,
    xlsxFileId: uploadedXlsx.id,
    xlsxLink: uploadedXlsx.webViewLink,
    spreadsheetId,
    syncedAt: new Date().toISOString(),
  };
}

const LEGACY_JSON_NAME = 'hisab-data.json';
const LEGACY_SHEET_NAME = 'Hisab-Transactions';

function mapTypeString(val: unknown): Transaction['type'] {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'income' || s.includes('আয়') || s.includes('আয়')) return 'income';
  if (s === 'debt' || s.includes('ঋণ নে') || s === 'ঋণ' || s.includes('দেনা')) return 'debt';
  if (s === 'paona' || s.includes('পাওনা') || s.includes('ঋণ দে')) return 'paona';
  return 'expense';
}

export function parseXlsxBuffer(buf: ArrayBuffer): {
  transactions: unknown[];
  profile?: Partial<UserProfile>;
} | null {
  const wb = XLSX.read(buf, { type: 'array' });

  // Prefer lossless Takar_Hisab_Data sheet (fallback to legacy Hisab_Data)
  const dataSheet = wb.Sheets['Takar_Hisab_Data'] || wb.Sheets['Hisab_Data'];
  if (dataSheet) {
    const rows = XLSX.utils.sheet_to_json<{ ChunkIndex: number; Payload: string }>(dataSheet);
    rows.sort((a, b) => a.ChunkIndex - b.ChunkIndex);
    const jsonStr = rows.map((r) => r.Payload).join('');
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  }

  // Fallback to Transactions or Master sheet + optional Repayments sheet
  const txSheet = wb.Sheets['Transactions'] || wb.Sheets['Master'];
  if (txSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(txSheet);
    const repMap = new Map<number, { amount: number; date: string }[]>();
    const repSheet = wb.Sheets['Repayments'];
    if (repSheet) {
      const repRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(repSheet);
      repRows.forEach((rr) => {
        const txId = Number(rr.TxID || rr.ID || rr.id || 0);
        const amt = numParse((rr.Amount as string | number) ?? 0);
        const date = String(rr.Date || todayIso()).slice(0, 10);
        if (txId && amt > 0) {
          const list = repMap.get(txId) || [];
          list.push({ amount: amt, date });
          repMap.set(txId, list);
        }
      });
    }

    const txs = rows
      .filter((r) => {
        const amt = numParse((r.Amount ?? r.amount ?? 0) as string | number);
        return Number.isFinite(amt) && amt > 0;
      })
      .map((r, i) => {
        const id = Number(r.ID || r.id) || Date.now() + i;
        const amt = numParse((r.Amount ?? r.amount ?? 0) as string | number);
        const typeVal = r.TypeCode || r.type || r.Type || r['ধরণ'];
        return {
          id,
          date: String(r.Date || r.date || todayIso()).slice(0, 10),
          type: mapTypeString(typeVal),
          category: String(r.CategoryRaw || r.Category || r.category || 'অন্যান্য'),
          desc: String(r.Description || r.desc || r.Category || ''),
          person: String(r.Person || r.person || ''),
          amount: amt,
          months: Math.max(1, Number(r.Months || r.months) || 1),
          repayments: repMap.get(id) || [],
          ts: Date.now() + i,
        };
      });
    if (txs.length > 0) return { transactions: txs };
  }

  return null;
}

async function findFileAnywhere(
  token: string,
  folderIds: string[],
  name: string,
  mimeType?: string
): Promise<{ id: string; name: string; modifiedTime?: string } | null> {
  for (const folderId of folderIds) {
    const found = await findFileInFolder(token, folderId, name, mimeType);
    if (found) return found;
  }
  const parts = [`name='${name}'`, 'trashed=false'];
  if (mimeType) parts.push(`mimeType='${mimeType}'`);
  const q = encodeURIComponent(parts.join(' and '));
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
    token
  );
  return res.files?.[0] || null;
}

async function readSheetValues(
  token: string,
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  try {
    const res = await driveFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      token
    );
    return Array.isArray(res.values) ? res.values : [];
  } catch {
    return [];
  }
}

function parseRowsWithHeaders(values: string[][]): Record<string, string>[] {
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || '').trim());
  return values.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = String(row[idx] ?? '');
    });
    return obj;
  });
}

export async function restoreFromGoogleDriveXlsx(token: string): Promise<{
  transactions: unknown[];
  profile?: Partial<UserProfile>;
} | null> {
  const folderIds: string[] = [];
  const primaryFolder = await findFolderByName(token, DRIVE_FOLDER_NAME);
  if (primaryFolder) folderIds.push(primaryFolder);
  const legacyFolder = await findFolderByName(token, LEGACY_FOLDER_NAME);
  if (legacyFolder) folderIds.push(legacyFolder);

  // 1) Try Excel (.xlsx) files (new & legacy)
  for (const xlsxName of [XLSX_FILE_NAME, LEGACY_XLSX_NAME]) {
    const existingXlsx = await findFileAnywhere(token, folderIds, xlsxName);
    if (existingXlsx) {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${existingXlsx.id}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        clearAccessToken();
        throw new Error('AUTH_EXPIRED');
      }
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const parsed = parseXlsxBuffer(buf);
        if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          return parsed;
        }
      }
    }
  }

  // 2) Try legacy hisab-data.json backup
  const jsonFile = await findFileAnywhere(token, folderIds, LEGACY_JSON_NAME);
  if (jsonFile) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${jsonFile.id}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 401) {
      clearAccessToken();
      throw new Error('AUTH_EXPIRED');
    }
    if (res.ok) {
      try {
        const parsed = await res.json();
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { transactions: parsed };
        }
        if (parsed && Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
          return parsed;
        }
      } catch {
        // continue to sheet fallback
      }
    }
  }

  // 3) Try current or legacy Google Sheets ('Takar-Hisab-Transactions' or 'Hisab-Transactions')
  for (const sheetName of [SHEET_FILE_NAME, LEGACY_SHEET_NAME]) {
    const sheetFile = await findFileAnywhere(
      token,
      folderIds,
      sheetName,
      'application/vnd.google-apps.spreadsheet'
    );
    if (!sheetFile) continue;

    const repMap = new Map<number, { amount: number; date: string }[]>();
    const repRaw = await readSheetValues(token, sheetFile.id, 'Repayments!A1:Z');
    const repRows = parseRowsWithHeaders(repRaw);
    repRows.forEach((rr) => {
      const txId = Number(rr.TxID || rr.ID || rr.id || 0);
      const amt = numParse(rr.Amount || rr['পরিমাণ'] || '0');
      const date = String(rr.Date || rr['তারিখ'] || todayIso()).slice(0, 10);
      if (txId && amt > 0) {
        const list = repMap.get(txId) || [];
        list.push({ amount: amt, date });
        repMap.set(txId, list);
      }
    });

    const tabName = sheetName === LEGACY_SHEET_NAME ? 'Master' : 'Transactions';
    let values = await readSheetValues(token, sheetFile.id, `${tabName}!A1:Z`);
    if (values.length < 2 && tabName !== 'Master') {
      values = await readSheetValues(token, sheetFile.id, 'Master!A1:Z');
    }
    const rows = parseRowsWithHeaders(values);
    const txs = rows
      .filter((r) => {
        const amt = numParse(r.Amount || r['পরিমাণ'] || r['টাকা'] || '0');
        return Number.isFinite(amt) && amt > 0;
      })
      .map((r, i) => {
        const id = Number(r.ID || r.id) || Date.now() + i;
        const amt = numParse(r.Amount || r['পরিমাণ'] || r['টাকা'] || '0');
        const date = String(r.Date || r['তারিখ'] || todayIso()).slice(0, 10);
        const type = mapTypeString(r.TypeCode || r.Type || r['ধরণ']);
        const paidLegacy = numParse(r['Paid/Collected'] || r.Paid || '0');
        const reps = repMap.get(id) || (paidLegacy > 0 ? [{ amount: paidLegacy, date }] : []);
        return {
          id,
          date,
          type,
          category: String(r.CategoryRaw || r.Category || r['খাত'] || 'অন্যান্য'),
          desc: String(r.Description || r['বিবরণ'] || r.Category || ''),
          person: String(r.Person || r['ব্যক্তি'] || ''),
          amount: amt,
          months: Math.max(1, Number(r.Months || r['মাস']) || 1),
          repayments: reps,
          ts: Date.now() + i,
        };
      });

    if (txs.length > 0) {
      return { transactions: txs };
    }
  }

  return null;
}
