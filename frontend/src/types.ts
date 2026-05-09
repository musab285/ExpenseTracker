/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface Profile {
  id: number;
  accountType: string;
  balance: number;
  current_month_expenses: number;
  current_month_income: number;
}

export interface Transaction {
  id: number;
  type: 'expense' | 'income' | 'debt';
  name: string;
  amount: number;
  timestamp: string;
  category: string;
  category_id?: number;
  profile_id?: number;
  merchant?: string;
  status?: 'cleared' | 'pending' | 'unpaid';
  comments?: string;
  is_paid?: boolean;
  due_date?: string;
  payment_type?: string;
  ref_id?: string;
}

export interface DashboardStats {
  total_income: number;
  total_expenses: number;
  total_debt: number;
  net_balance: number;
  recent_transactions: Transaction[];
}

export interface Category {
  id: number;
  name: string;
}

// PaymentInfo removed
export interface MonthlyData {
  year: number;
  month: number;
  income: number;
  expenses: number;
  debt: number;
  savings: number;
}

export interface MonthlyDetailData extends MonthlyData {
  expense_by_category: { category: string; total: number }[];
  top_expenses: Transaction[];
  daily_spending: { day: number; total: number }[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
