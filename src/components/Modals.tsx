import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronDown,
  Globe,
  Layers,
  Pencil,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { Language, Transaction, TxType } from '../types/hisab';
import {
  ALL_CAT_NAMES,
  CATEGORY_GROUPS,
  INCOME_CATS,
  PROBASHI_GROUP_TITLE,
  TOTAL_ITEMS,
  catLabel,
  findCategoryIcon,
  groupLabel,
} from '../data/categories';
import { fmtDate, money, tr, typeLabel } from '../data/i18n';
import { compressImage, numParse, personGroups, sumPay, todayIso } from '../utils/storage';
import { SquircleIcon } from './CategoryIcon';
import { BounceButton, ModalSheet } from './MotionPrimitives';

const DEFAULT_SHORTCUT_CATS = [
  'প্রতিদিনের বাজার',
  'লোকাল বাস',
  'চা-কফি',
  'বিদ্যুৎ বিল',
  'বেতন',
  'ঋণ নেওয়া',
];

/* ============ Add / Edit Transaction Modal ============ */
interface AddTxModalProps {
  open: boolean;
  lang: Language;
  transactions: Transaction[];
  editingTx: Transaction | null;
  presetCat: string;
  presetType: TxType | '';
  presetSeq?: number;
  defaultCat: string;
  defaultMonths: number;
  onClose: () => void;
  onOpenCategories: (focusGroup?: string) => void;
  onSave: (tx: Transaction, isEdit: boolean) => void;
  onToast: (msg: string) => void;
}

export const AddTxModal: React.FC<AddTxModalProps> = ({
  open,
  lang,
  transactions,
  editingTx,
  presetCat,
  presetType,
  presetSeq = 0,
  defaultCat,
  defaultMonths,
  onClose,
  onOpenCategories,
  onSave,
  onToast,
}) => {
  const [category, setCategory] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('expense');
  const [date, setDate] = useState(todayIso());
  const [person, setPerson] = useState('');
  const [months, setMonths] = useState('');
  const [voucher, setVoucher] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCatDropdownOpen(false);
      setFormError(null);
      return;
    }
    setFormError(null);
    if (editingTx) {
      setCategory(editingTx.category || '');
      setDesc(editingTx.desc || '');
      setAmount(String(editingTx.amount || ''));
      setType(editingTx.type);
      setDate(editingTx.date || todayIso());
      setPerson(editingTx.person || '');
      setMonths(String(editingTx.months || ''));
      setVoucher(editingTx.voucher || null);
    } else {
      const cat = presetCat || defaultCat || '';
      const inferredType: TxType =
        presetType ||
        (cat === 'ঋণ নেওয়া'
          ? 'debt'
          : cat === 'পাওনা'
          ? 'paona'
          : INCOME_CATS.has(cat)
          ? 'income'
          : 'expense');
      setCategory(cat);
      setDesc('');
      setAmount('');
      setType(inferredType);
      setDate(todayIso());
      setPerson('');
      setMonths(
        inferredType === 'debt' || inferredType === 'paona'
          ? String(defaultMonths || 1)
          : ''
      );
      setVoucher(null);
    }
  }, [open, editingTx, presetType, defaultCat, defaultMonths]);

  // Apply presetCat picked from CategoriesModal without wiping user's typed amount/desc
  useEffect(() => {
    if (!open || editingTx || !presetCat) return;
    setCategory(presetCat);
    if (presetCat === 'ঋণ নেওয়া') setType('debt');
    else if (presetCat === 'পাওনা') setType('paona');
    else if (INCOME_CATS.has(presetCat)) setType('income');
    else if (ALL_CAT_NAMES.includes(presetCat)) setType('expense');
    setCatDropdownOpen(false);
  }, [open, editingTx, presetCat, presetSeq]);

  // Top most-added categories from user's history + helpful fallback defaults
  const frequentShortcuts = useMemo(() => {
    const counts = new Map<string, { count: number; lastTs: number; lastType?: TxType }>();
    for (const tx of transactions) {
      const name = (tx.category || '').trim();
      if (!name) continue;
      const prev = counts.get(name);
      const ts = tx.ts || 0;
      if (prev) {
        prev.count += 1;
        if (ts >= prev.lastTs) {
          prev.lastTs = ts;
          prev.lastType = tx.type;
        }
      } else {
        counts.set(name, { count: 1, lastTs: ts, lastType: tx.type });
      }
    }

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count || b[1].lastTs - a[1].lastTs)
      .slice(0, 6)
      .map(([name, info]) => ({
        name,
        count: info.count,
        icon: findCategoryIcon(name),
        txType: info.lastType,
      }));

    if (sorted.length < 6) {
      const seen = new Set(sorted.map((s) => s.name));
      for (const def of DEFAULT_SHORTCUT_CATS) {
        if (sorted.length >= 6) break;
        if (!seen.has(def)) {
          seen.add(def);
          sorted.push({
            name: def,
            count: 0,
            icon: findCategoryIcon(def),
            txType:
              def === 'বেতন'
                ? 'income'
                : def === 'ঋণ নেওয়া'
                ? 'debt'
                : def === 'পাওনা'
                ? 'paona'
                : 'expense',
          });
        }
      }
    }
    return sorted;
  }, [transactions]);

  // Combined list of custom categories from history + preset categories for typing/search
  const allSearchableCats = useMemo(() => {
    const set = new Set<string>(ALL_CAT_NAMES);
    const custom: string[] = [];
    for (const tx of transactions) {
      const c = (tx.category || '').trim();
      if (c && !set.has(c)) {
        set.add(c);
        custom.push(c);
      }
    }
    return [...custom, ...ALL_CAT_NAMES];
  }, [transactions]);

  const filteredCats = useMemo(() => {
    const q = category.trim().toLowerCase();
    if (!q) return allSearchableCats.slice(0, 24);
    return allSearchableCats
      .filter(
        (name) =>
          name.toLowerCase().includes(q) ||
          catLabel(name, lang).toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [category, allSearchableCats, lang]);

  const handleCatChange = (val: string, inferredType?: TxType) => {
    setCategory(val);
    if (val === 'ঋণ নেওয়া') setType('debt');
    else if (val === 'পাওনা') setType('paona');
    else if (INCOME_CATS.has(val)) setType('income');
    else if (inferredType) setType(inferredType);
    else if (type === 'income' && ALL_CAT_NAMES.includes(val)) setType('expense');
  };

  const handleTypeChange = (val: TxType) => {
    setType(val);
    if (val === 'debt') setCategory('ঋণ নেওয়া');
    else if (val === 'paona') setCategory('পাওনা');
  };

  const handleVoucher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    compressImage(f, 900, 0.7, (d) => setVoucher(d));
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCatDropdownOpen(false);
    const parsedAmt = numParse(amount);
    if (!(parsedAmt > 0)) {
      const msg =
        lang === 'bn'
          ? 'দয়া করে ০-এর বেশি টাকার পরিমাণ লিখুন'
          : 'Please enter an amount greater than 0';
      setFormError(msg);
      onToast(msg);
      return;
    }
    const isLoan = type === 'debt' || type === 'paona';
    if (editingTx && isLoan && sumPay(editingTx) > parsedAmt + 0.001) {
      const msg =
        lang === 'bn'
          ? `ইতিমধ্যে ${money(sumPay(editingTx), lang)} পরিশোধ হয়েছে`
          : `Already repaid ${money(sumPay(editingTx), lang)}`;
      setFormError(msg);
      onToast(msg);
      return;
    }
    setFormError(null);
    const finalCat = category.trim() || 'অন্যান্য';
    const cleanTx: Transaction = {
      id: editingTx ? editingTx.id : Date.now(),
      category: finalCat,
      desc: desc.trim() || catLabel(finalCat, lang),
      amount: parsedAmt,
      type,
      months: Math.max(1, Math.round(numParse(months)) || 1),
      person: isLoan ? person.trim() || desc.trim() : '',
      date: date || todayIso(),
      voucher,
      voucherId:
        editingTx && voucher && voucher === editingTx.voucher
          ? editingTx.voucherId
          : undefined,
      ts: editingTx ? editingTx.ts : Date.now(),
      repayments: editingTx && isLoan ? editingTx.repayments || [] : [],
    };
    onSave(cleanTx, !!editingTx);
  };

  const isDebtOrPaona = type === 'debt' || type === 'paona';
  const currentIcon = findCategoryIcon(category.trim());

  return (
    <ModalSheet open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold">
            {editingTx ? tr(lang, 'editTitle') : tr(lang, 'newE')}
          </h3>
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {tr(lang, 'cat')}
              </label>
              {category.trim() && !ALL_CAT_NAMES.includes(category.trim()) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-[#86E37D]">
                  {lang === 'bn' ? 'কাস্টম ক্যাটাগরি' : 'Custom'}
                </span>
              )}
            </div>

            {/* Typeable + Selectable Category Combobox */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center rounded-xl bg-zinc-50 dark:bg-[#171A23] border border-zinc-200 dark:border-white/15 focus-within:ring-2 focus-within:ring-[#1677E8]/50 dark:focus-within:ring-[#C4F135]/50">
                <span className="pl-2 pr-1.5 shrink-0">
                  <SquircleIcon name={currentIcon} txType={type} size="xs" />
                </span>
                <input
                  type="text"
                  value={category}
                  onFocus={() => setCatDropdownOpen(true)}
                  onChange={(e) => {
                    handleCatChange(e.target.value);
                    setCatDropdownOpen(true);
                  }}
                  placeholder={
                    lang === 'bn'
                      ? 'ক্যাটাগরি লিখুন বা বাছাই করুন...'
                      : 'Type or choose category...'
                  }
                  className="w-full py-2.5 pr-16 bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                {category && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('');
                      setCatDropdownOpen(true);
                    }}
                    aria-label="Clear category"
                    className="absolute right-9 p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCatDropdownOpen((v) => !v)}
                  aria-label="Toggle category list"
                  className="absolute right-1.5 p-1.5 rounded-lg text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/10"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      catDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              <BounceButton
                onClick={() => {
                  setCatDropdownOpen(false);
                  onOpenCategories(PROBASHI_GROUP_TITLE);
                }}
                aria-label={lang === 'bn' ? 'প্রবাসী খরচ তালিকা' : 'Probashi categories'}
                title={lang === 'bn' ? 'প্রবাসী খরচ তালিকা' : 'Probashi categories'}
                className="h-11 px-2.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-400/15 border border-emerald-500/35 text-emerald-700 dark:text-[#86E37D] flex items-center gap-1.5 shrink-0 text-[11px] font-extrabold"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>{lang === 'bn' ? 'প্রবাসী' : 'Probashi'}</span>
              </BounceButton>

              <BounceButton
                onClick={() => {
                  setCatDropdownOpen(false);
                  onOpenCategories();
                }}
                aria-label={tr(lang, 'viewAll')}
                title={tr(lang, 'viewAll')}
                className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-[#C4F135] flex items-center justify-center shrink-0"
              >
                <Layers className="w-4 h-4" />
              </BounceButton>
            </div>

            {/* Inline Searchable Dropdown Suggestions */}
            {catDropdownOpen && (
              <div className="mt-1.5 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-[#171A23] border border-sky-200/80 dark:border-white/15 shadow-xl p-1.5 space-y-0.5 z-20 relative">
                {category.trim() &&
                  !filteredCats.some(
                    (c) => c.toLowerCase() === category.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCatChange(category.trim());
                        setCatDropdownOpen(false);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-900 dark:text-[#86E37D] font-bold text-xs"
                    >
                      <SquircleIcon name="dots" txType={type} size="xs" />
                      <span className="truncate">
                        {lang === 'bn'
                          ? `নতুন যোগ করুন: "${category.trim()}"`
                          : `Use custom: "${category.trim()}"`}
                      </span>
                    </button>
                  )}

                {filteredCats.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      handleCatChange(name);
                      setCatDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 text-left text-xs font-semibold transition-colors ${
                      category === name
                        ? 'bg-sky-100 dark:bg-[#C4F135]/15 text-sky-900 dark:text-[#C4F135]'
                        : 'hover:bg-sky-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-zinc-100'
                    }`}
                  >
                    <SquircleIcon name={findCategoryIcon(name)} size="xs" />
                    <span className="truncate flex-1">{catLabel(name, lang)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Most Frequently Added Category Shortcuts */}
            <div className="mt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                {lang === 'bn' ? 'দ্রুত শর্টকাট (বেশি ব্যবহৃত)' : 'Frequent Shortcuts'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {frequentShortcuts.map((item) => {
                  const active = category === item.name;
                  return (
                    <BounceButton
                      key={item.name}
                      onClick={() => {
                        handleCatChange(item.name, item.txType);
                        setCatDropdownOpen(false);
                      }}
                      bounceScale={0.93}
                      className={`px-2 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold border transition-colors ${
                        active
                          ? 'bg-[#1677E8]/12 border-[#1677E8] text-[#1677E8] dark:bg-[#C4F135]/18 dark:border-[#C4F135] dark:text-[#C4F135]'
                          : 'bg-sky-50/75 dark:bg-white/[0.05] border-sky-200/70 dark:border-white/10 text-slate-800 dark:text-zinc-200 hover:bg-sky-100/80 dark:hover:bg-white/[0.09]'
                      }`}
                    >
                      <SquircleIcon
                        name={item.icon}
                        txType={item.txType}
                        size="xs"
                        className="!w-6 !h-6 !rounded-[7px]"
                      />
                      <span className="truncate max-w-[110px]">
                        {catLabel(item.name, lang)}
                      </span>
                      {item.count > 0 && (
                        <span className="text-[9px] font-extrabold opacity-65 tabular-nums">
                          ×{item.count}
                        </span>
                      )}
                    </BounceButton>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              {tr(lang, 'desc')}
            </label>
            <input
              type="text"
              value={desc}
              onFocus={() => setCatDropdownOpen(false)}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={
                category.trim()
                  ? catLabel(category.trim(), lang)
                  : tr(lang, 'desc')
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                {tr(lang, 'amount')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onFocus={() => setCatDropdownOpen(false)}
                onChange={(e) => {
                  setFormError(null);
                  setAmount(
                    e.target.value.replace(/[০-৯]/g, (d) =>
                      String('০১২৩৪৫৬৭৮৯'.indexOf(d))
                    )
                  );
                }}
                placeholder="0"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border text-sm font-bold tabular-nums ${
                  formError
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-zinc-200 dark:border-white/10'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                {tr(lang, 'type')}
              </label>
              <select
                value={type}
                onFocus={() => setCatDropdownOpen(false)}
                onChange={(e) => {
                  setFormError(null);
                  handleTypeChange(e.target.value as TxType);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#171A23] border border-zinc-200 dark:border-white/15 text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                <option value="expense">{tr(lang, 'expenseT')}</option>
                <option value="income">{tr(lang, 'incomeT')}</option>
                <option value="debt">{tr(lang, 'debtT')}</option>
                <option value="paona">{tr(lang, 'paonaT')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              {tr(lang, 'date')}
            </label>
            <input
              type="date"
              value={date}
              onFocus={() => setCatDropdownOpen(false)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm"
            />
          </div>

          {isDebtOrPaona && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {type === 'debt' ? tr(lang, 'lenderDebt') : tr(lang, 'lenderPaona')}
                </label>
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {tr(lang, 'monthsL')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) =>
                    setMonths(
                      e.target.value.replace(/[০-৯]/g, (d) =>
                        String('০১২৩৪৫৬৭৮৯'.indexOf(d))
                      )
                    )
                  }
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm tabular-nums"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              {tr(lang, 'voucher')}
            </label>
            <label className="cursor-pointer rounded-xl border border-dashed border-zinc-300 dark:border-white/20 bg-zinc-50 dark:bg-white/[0.03] py-2.5 px-4 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-[#C4F135]">
              <Camera className="w-4 h-4" />
              <span>{tr(lang, 'photo')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleVoucher}
                className="hidden"
              />
            </label>
            {voucher && (
              <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-300 dark:border-white/20">
                <img
                  src={voucher}
                  alt="Voucher preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setVoucher(null)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/12 border border-rose-500/35 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
              {formError}
            </div>
          )}

          <BounceButton
            type="submit"
            sound="success"
            className="w-full py-3.5 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{tr(lang, 'save')}</span>
          </BounceButton>
        </form>
      </div>
    </ModalSheet>
  );
};

/* ============ All Categories Modal ============ */
interface CategoriesModalProps {
  open: boolean;
  lang: Language;
  focusGroup?: string | null;
  onClose: () => void;
  onPick: (catName: string) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  open,
  lang,
  focusGroup,
  onClose,
  onPick,
}) => {
  const [openGroup, setOpenGroup] = useState<number | null>(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (focusGroup) {
      const idx = CATEGORY_GROUPS.findIndex((g) => g.title === focusGroup);
      setOpenGroup(idx >= 0 ? idx : 0);
    } else {
      setOpenGroup(0);
    }
  }, [open, focusGroup]);

  const probashiIdx = useMemo(
    () => CATEGORY_GROUPS.findIndex((g) => g.title === PROBASHI_GROUP_TITLE),
    []
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORY_GROUPS;
    return CATEGORY_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          catLabel(it.name, lang).toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [query, lang]);

  return (
    <ModalSheet open={open} onClose={onClose} zIndex="z-[60]">
      <div className="p-6 flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold">
            {tr(lang, 'cat')} ({TOTAL_ITEMS})
          </h3>
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        {/* Dedicated Featured Probashi Button inside Categories */}
        {probashiIdx >= 0 && (
          <BounceButton
            onClick={() => {
              setQuery('');
              setOpenGroup(probashiIdx);
            }}
            bounceScale={0.98}
            className="mb-3 w-full px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 dark:from-emerald-500/25 dark:via-teal-500/20 dark:to-sky-500/25 border border-emerald-400/50 text-white dark:text-[#86E37D] flex items-center justify-between gap-3 text-left shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-white/20 dark:bg-emerald-500/25 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold truncate">
                  {lang === 'bn'
                    ? 'প্রবাসী ভাই-বোনদের বিশেষ তালিকা'
                    : 'Probashi (Expatriate) Expenses'}
                </p>
                <p className="text-[10px] opacity-90 truncate">
                  {lang === 'bn'
                    ? 'বাড়িতে টাকা পাঠানো, ভিসা, টিকিট ও বিদেশের সব খরচ'
                    : 'Send money home, Visa/Iqama, Flight & Living'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black shrink-0">
              {CATEGORY_GROUPS[probashiIdx].items.length}
            </span>
          </BounceButton>
        )}

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(lang, 'catSearchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm"
          />
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {filteredGroups.map((g, idx) => {
            const isOpen = query.trim().length > 0 || openGroup === idx;
            const isProbashi = g.title === PROBASHI_GROUP_TITLE;
            return (
              <div
                key={g.title}
                className={`rounded-2xl border overflow-hidden ${
                  isProbashi
                    ? 'border-emerald-400/70 dark:border-emerald-400/35'
                    : 'border-zinc-200/80 dark:border-white/10'
                }`}
              >
                <BounceButton
                  onClick={() => setOpenGroup(isOpen ? null : idx)}
                  bounceScale={0.99}
                  className={`w-full px-3.5 py-3 flex items-center gap-2.5 text-left transition-colors ${
                    isProbashi
                      ? 'bg-emerald-50/90 dark:bg-emerald-500/12 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/20 text-emerald-950 dark:text-[#86E37D]'
                      : 'bg-sky-50/80 dark:bg-[#181B24] hover:bg-sky-100/70 dark:hover:bg-[#1F2430] text-slate-900 dark:text-zinc-100'
                  }`}
                >
                  <SquircleIcon name={g.icon} size="xs" />
                  <span className="text-xs font-bold flex-1">
                    {groupLabel(g.title, lang)}
                  </span>
                  <span className="text-[11px] opacity-70 tabular-nums">
                    {g.items.length}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 opacity-60 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </BounceButton>

                {isOpen && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-white/80 dark:bg-[#12151C]">
                    {g.items.map((it) => (
                      <button
                        key={it.name}
                        type="button"
                        onClick={() => onPick(it.name)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border active:scale-92 transition-transform duration-150 cursor-pointer ${
                          isProbashi
                            ? 'bg-emerald-50/60 dark:bg-emerald-500/[0.06] text-slate-900 dark:text-zinc-100 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15 border-emerald-200/70 dark:border-emerald-400/20'
                            : 'bg-sky-50/60 dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 hover:bg-sky-100/80 dark:hover:bg-[#C4F135]/15 border-sky-100 dark:border-transparent dark:hover:border-[#C4F135]/30'
                        }`}
                      >
                        <SquircleIcon name={it.icon} size="sm" className="mb-1.5" />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-zinc-100 text-center leading-tight line-clamp-2">
                          {catLabel(it.name, lang)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalSheet>
  );
};

/* ============ Transaction Detail Modal ============ */
interface DetailModalProps {
  tx: Transaction | null;
  lang: Language;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  onViewVoucher: (src: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  tx,
  lang,
  onClose,
  onEdit,
  onDelete,
  onViewVoucher,
}) => {
  if (!tx) return null;
  const isLoan = tx.type === 'debt' || tx.type === 'paona';
  const rem = isLoan ? tx.amount - sumPay(tx) : 0;

  const rows: [string, string][] = [
    [tr(lang, 'desc'), tx.desc],
    [tr(lang, 'cat'), catLabel(tx.category, lang)],
    [tr(lang, 'typeL'), typeLabel(tx.type, lang)],
    [tr(lang, 'amount'), money(tx.amount, lang)],
    [tr(lang, 'date'), fmtDate(tx.date, lang)],
  ];
  if (tx.person) rows.push([tr(lang, 'person'), tx.person]);
  if (isLoan && tx.months > 1) {
    rows.push([tr(lang, 'monthly'), `${money(tx.amount / tx.months, lang)} × ${tx.months}`]);
  }
  if (isLoan) rows.push([tr(lang, 'remaining'), money(rem, lang)]);

  return (
    <ModalSheet open={!!tx} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold">{tr(lang, 'detail')}</h3>
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-white/[0.06] text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <span className="text-zinc-500 dark:text-zinc-400 shrink-0">{k}</span>
              <strong className="text-right text-zinc-900 dark:text-zinc-100 tabular-nums">
                {v}
              </strong>
            </div>
          ))}
        </div>

        {tx.voucher && (
          <BounceButton
            onClick={() => onViewVoucher(tx.voucher!)}
            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-white/20"
          >
            <img src={tx.voucher} alt="Voucher" className="w-full h-full object-cover" />
          </BounceButton>
        )}

        {(tx.repayments || []).length > 0 && (
          <div>
            <p className="text-xs font-bold text-zinc-500 mb-1.5">
              {tr(lang, 'history')}
            </p>
            <div className="space-y-1 text-xs">
              {tx.repayments.map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1 border-b border-zinc-100 dark:border-white/[0.06]"
                >
                  <span className="text-zinc-500">{fmtDate(r.date, lang)}</span>
                  <strong className="tabular-nums">
                    {tx.type === 'paona' ? '+' : '−'} {money(r.amount, lang)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <BounceButton
            onClick={() => {
              onClose();
              onEdit(tx);
            }}
            className="py-3 rounded-xl bg-zinc-100 dark:bg-white/[0.08] font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{tr(lang, 'editE')}</span>
          </BounceButton>
          <BounceButton
            onClick={() => {
              onClose();
              onDelete(tx.id);
            }}
            className="py-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{tr(lang, 'del')}</span>
          </BounceButton>
        </div>
      </div>
    </ModalSheet>
  );
};

/* ============ Repay / Collect Modal ============ */
interface PayModalProps {
  mode: 'debt' | 'paona' | null;
  person: string | null;
  transactions: Transaction[];
  lang: Language;
  onClose: () => void;
  onApplyPay: (mode: 'debt' | 'paona', person: string, amount: number, date: string) => void;
  onDeletePay: (txId: number, idx: number) => void;
  onToast: (msg: string) => void;
}

export const PayModal: React.FC<PayModalProps> = ({
  mode,
  person,
  transactions,
  lang,
  onClose,
  onApplyPay,
  onDeletePay,
  onToast,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (mode && person) {
      setAmount('');
      setDate(todayIso());
      setPayError(null);
    }
  }, [mode, person]);

  const group = useMemo(() => {
    if (!mode || !person) return null;
    return personGroups(transactions, mode).find((g) => g.person === person) || null;
  }, [transactions, mode, person]);

  if (!mode || !person || !group) return null;
  const rem = group.total - group.paid;
  const isDebt = mode === 'debt';

  const history: { amount: number; date: string; txId: number; idx: number }[] = [];
  group.items.forEach((d) =>
    (d.repayments || []).forEach((r, idx) =>
      history.push({ amount: r.amount, date: r.date, txId: d.id, idx })
    )
  );

  const submit = () => {
    const amt = numParse(amount);
    if (!(amt > 0)) {
      const msg = lang === 'bn' ? 'সঠিক সংখ্যা লিখুন' : 'Enter a valid amount';
      setPayError(msg);
      onToast(msg);
      return;
    }
    if (amt > rem + 0.001) {
      const msg =
        lang === 'bn'
          ? `বাকির চেয়ে বেশি দেওয়া যাবে না (${money(rem, lang)})`
          : `Cannot exceed remaining (${money(rem, lang)})`;
      setPayError(msg);
      onToast(msg);
      return;
    }
    setPayError(null);
    onApplyPay(mode, person, amt, date || todayIso());
    onClose();
  };

  return (
    <ModalSheet open={!!mode} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">
              {isDebt ? tr(lang, 'repay') : tr(lang, 'collect')}
            </h3>
            <p className="text-xs font-semibold text-zinc-500 dark:text-[#C4F135] mt-0.5">
              {person}
            </p>
          </div>
          <BounceButton
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </BounceButton>
        </div>

        <div className="rounded-2xl p-4 bg-zinc-50 dark:bg-white/[0.04] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">{isDebt ? tr(lang, 'total') : tr(lang, 'given')}</span>
            <strong className="tabular-nums">{money(group.total, lang)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">{tr(lang, 'monthly')}</span>
            <strong className="tabular-nums">{money(group.monthly, lang)}</strong>
          </div>
          <div className="flex justify-between text-lime-600 dark:text-[#C4F135]">
            <span>{isDebt ? tr(lang, 'repaid') : tr(lang, 'collected')}</span>
            <strong className="tabular-nums">{money(group.paid, lang)}</strong>
          </div>
          <div className="flex justify-between border-t border-zinc-200 dark:border-white/10 pt-2 text-rose-600 dark:text-rose-400">
            <span>{tr(lang, 'remaining')}</span>
            <strong className="tabular-nums">{money(rem, lang)}</strong>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">
              {isDebt ? tr(lang, 'repayAmt') : tr(lang, 'collectAmt')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setPayError(null);
                setAmount(
                  e.target.value.replace(/[০-৯]/g, (d) =>
                    String('০১২৩৪৫৬৭৮৯'.indexOf(d))
                  )
                );
              }}
              placeholder="0"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border text-sm font-bold tabular-nums ${
                payError
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : 'border-zinc-200 dark:border-white/10'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">
              {tr(lang, 'date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-sm"
            />
          </div>

          {payError && (
            <div className="px-3.5 py-2 rounded-xl bg-rose-500/12 border border-rose-500/35 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
              {payError}
            </div>
          )}

          <BounceButton
            type="submit"
            sound="success"
            className="w-full py-3 rounded-2xl bg-[#1677E8] text-white dark:bg-[#C4F135] dark:text-zinc-950 font-bold text-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isDebt ? tr(lang, 'saveRepay') : tr(lang, 'saveCollect')}</span>
          </BounceButton>
        </form>

        {history.length > 0 && (
          <div>
            <p className="text-xs font-bold text-zinc-500 mb-1.5">
              {tr(lang, 'history')}
            </p>
            <div className="space-y-1 text-xs">
              {history
                .slice(-8)
                .reverse()
                .map((r, i) => (
                  <div
                    key={`${r.txId}-${r.idx}-${i}`}
                    className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-white/[0.06]"
                  >
                    <span className="text-zinc-500">{fmtDate(r.date, lang)}</span>
                    <div className="flex items-center gap-2">
                      <strong className="tabular-nums">
                        {isDebt ? '−' : '+'} {money(r.amount, lang)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => onDeletePay(r.txId, r.idx)}
                        className="text-rose-500 p-1"
                        aria-label="Delete"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </ModalSheet>
  );
};
