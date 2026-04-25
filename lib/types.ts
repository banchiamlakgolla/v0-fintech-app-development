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

// BudgetCategory is now a string to allow custom categories
export type BudgetCategory = string

// Suggested categories (user can choose which ones to use or create custom ones)
export const SUGGESTED_CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: 'expenses', label: 'Expenses', color: 'var(--chart-1)' },
  { key: 'savings', label: 'Savings', color: 'var(--chart-2)' },
  { key: 'education', label: 'Education', color: 'var(--chart-3)' },
  { key: 'personal', label: 'Personal', color: 'var(--chart-4)' },
  { key: 'emergency', label: 'Emergency', color: 'var(--chart-5)' },
]

// Color palette for categories (used for custom categories)
export const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

// Helper to get category info (works for both suggested and custom categories)
export function getCategoryInfo(category: string, existingCategories: { category: string; label?: string }[] = []) {
  const suggested = SUGGESTED_CATEGORIES.find(c => c.key === category)
  if (suggested) return { label: suggested.label, color: suggested.color }
  
  // For custom categories, use the category name as label and assign a color
  const index = existingCategories.findIndex(c => c.category === category)
  const colorIndex = index >= 0 ? index % CATEGORY_COLORS.length : Math.abs(category.charCodeAt(0)) % CATEGORY_COLORS.length
  
  return {
    label: category.charAt(0).toUpperCase() + category.slice(1),
    color: CATEGORY_COLORS[colorIndex],
  }
}

// For backward compatibility, keep BUDGET_CATEGORIES but without default percentages
export const BUDGET_CATEGORIES = SUGGESTED_CATEGORIES.map(cat => ({
  ...cat,
  defaultPercentage: 0, // No defaults - user must set
}))

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
