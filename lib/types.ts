// User types
export interface User {
  id: string
  name: string
  email: string
  phone: string
  pin: string
  createdAt: string
}

// Income types
export interface Income {
  id: string
  userId: string
  amount: number
  date: string
}

// Budget allocation types
export interface Allocation {
  id: string
  userId: string
  category: BudgetCategory
  percentage: number
}

export type BudgetCategory = 
  | 'expenses'
  | 'savings'
  | 'education'
  | 'personal'
  | 'emergency'

export const BUDGET_CATEGORIES: { key: BudgetCategory; label: string; defaultPercentage: number; color: string }[] = [
  { key: 'expenses', label: 'Expenses', defaultPercentage: 40, color: 'var(--chart-1)' },
  { key: 'savings', label: 'Savings', defaultPercentage: 20, color: 'var(--chart-2)' },
  { key: 'education', label: 'Education', defaultPercentage: 15, color: 'var(--chart-3)' },
  { key: 'personal', label: 'Personal', defaultPercentage: 15, color: 'var(--chart-4)' },
  { key: 'emergency', label: 'Emergency', defaultPercentage: 10, color: 'var(--chart-5)' },
]

// Expense types
export interface Expense {
  id: string
  userId: string
  title: string
  amount: number
  category: BudgetCategory
  date: string
}

// Saved payment template types
export interface SavedPayment {
  id: string
  userId: string
  name: string
  accountNumber: string
  category: BudgetCategory
  defaultAmount: number
  dueDate: string
  autoPay: boolean
  frequency?: 'weekly' | 'monthly'
}

// Transaction types
export interface Transaction {
  id: string
  userId: string
  paymentId?: string
  expenseId?: string
  title: string
  amount: number
  category: BudgetCategory
  status: 'pending' | 'approved' | 'rejected'
  type: 'expense' | 'payment'
  date: string
}

// Approval request types
export interface ApprovalRequest {
  id: string
  userId: string
  paymentId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  approvedAt?: string
}

// OTP types
export interface OTP {
  id: string
  userId: string
  code: string
  expiresAt: string
}

// Notification types
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'reminder' | 'alert' | 'info'
  read: boolean
  createdAt: string
  paymentId?: string
}

// Auth state
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Budget summary
export interface BudgetSummary {
  category: BudgetCategory
  label: string
  percentage: number
  allocated: number
  spent: number
  remaining: number
  color: string
}
