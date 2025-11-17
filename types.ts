export interface Category {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
}

export type PayCycleFrequency = 'semanal' | 'quincenal' | 'mensual' | 'anual';

export interface BudgetRecord {
  id: string;
  name: string;
  totalIncome: number;
  categories: Category[];
  dateSaved: string;
  frequency: PayCycleFrequency;
}

export interface DailyExpense {
  id: string;
  note: string;
  amount: number;
  categoryId: string;
}

export interface PayCycleConfig {
  frequency: PayCycleFrequency;
  startDate: string; // ISO string
  income: number;
}

export interface CycleProfile {
  id: string;
  name: string;
  color: string;
  config: PayCycleConfig | null;
}

export type FutureExpenseFrequency = 'una-vez' | 'semanal' | 'quincenal' | 'mensual' | 'anual';

export interface FutureExpense {
    id: string;
    note: string;
    amount: number;
    categoryId: string;
    startDate: string; // ISO string for the first date
    frequency: FutureExpenseFrequency;
    endDate?: string | null; // Optional ISO string for when it stops repeating
}