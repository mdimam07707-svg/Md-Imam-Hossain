export type TxType = 'income' | 'expense' | 'debt' | 'paona';
export type Language = 'bn' | 'en' | 'ar' | 'zh';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PageKey = 'home' | 'hisab' | 'settings';
export type PeriodKey = 'month' | 'h1' | 'h2' | 'year';
export type FilterKey = 'all' | TxType;

export interface Repayment {
  amount: number;
  date: string;
}

export interface Transaction {
  id: number;
  category: string;
  desc: string;
  amount: number;
  type: TxType;
  months: number;
  person: string;
  date: string;
  voucher: string | null;
  voucherId?: string;
  ts: number;
  repayments: Repayment[];
}

export interface UserProfile {
  name: string;
  phone: string;
  occupation: string;
  email: string;
  address: string;
  bio: string;
  photo: string;
}

export interface PersonGroup {
  person: string;
  total: number;
  monthly: number;
  paid: number;
  items: Transaction[];
}

export interface PeriodSummary {
  income: number;
  expense: number;
  debt: number;
  repaid: number;
  paona: number;
  collected: number;
  balance: number;
}
