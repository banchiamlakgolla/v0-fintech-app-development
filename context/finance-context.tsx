'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  Income,
  Allocation,
  Expense,
  SavedPayment,
  Transaction,
  ApprovalRequest,
  Notification,
  BudgetSummary,
  BudgetCategory,
} from '@/lib/types'
import { BUDGET_CATEGORIES } from '@/lib/types'
import {
  incomeApi,
  allocationApi,
  expenseApi,
  savedPaymentApi,
  transactionApi,
  approvalApi,
  notificationApi,
} from '@/lib/api'
import { useAuth } from './auth-context'

interface FinanceContextType {
  // Data
  income: number
  allocations: Allocation[]
  expenses: Expense[]
  savedPayments: SavedPayment[]
  transactions: Transaction[]
  approvalRequests: ApprovalRequest[]
  notifications: Notification[]
  budgetSummary: BudgetSummary[]
  
  // Loading states
  isLoading: boolean
  
  // Actions
  refreshData: () => Promise<void>
  addIncome: (amount: number) => Promise<void>
  updateAllocations: (updates: { category: BudgetCategory; percentage: number }[]) => Promise<void>
  addExpense: (data: Omit<Expense, 'id' | 'userId'>) => Promise<void>
  addSavedPayment: (data: Omit<SavedPayment, 'id' | 'userId'>) => Promise<void>
  updateSavedPayment: (id: string, data: Partial<SavedPayment>) => Promise<void>
  deleteSavedPayment: (id: string) => Promise<void>
  processPayment: (paymentId: string, amount: number) => Promise<void>
  approveRequest: (requestId: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  const [income, setIncome] = useState(0)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [savedPayments, setSavedPayments] = useState<SavedPayment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const [
        incomeData,
        allocationsData,
        expensesData,
        paymentsData,
        transactionsData,
        approvalsData,
        notificationsData,
      ] = await Promise.all([
        incomeApi.getCurrentMonth(user.id),
        allocationApi.get(user.id),
        expenseApi.get(user.id),
        savedPaymentApi.get(user.id),
        transactionApi.get(user.id),
        approvalApi.get(user.id),
        notificationApi.get(user.id),
      ])
      
      setIncome(incomeData)
      setAllocations(allocationsData)
      setExpenses(expensesData)
      setSavedPayments(paymentsData)
      setTransactions(transactionsData)
      setApprovalRequests(approvalsData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Calculate budget summary
  const budgetSummary: BudgetSummary[] = BUDGET_CATEGORIES.map(cat => {
    const allocation = allocations.find(a => a.category === cat.key)
    const percentage = allocation?.percentage ?? cat.defaultPercentage
    const allocated = (income * percentage) / 100
    const thisMonth = new Date().toISOString().slice(0, 7)
    const spent = expenses
      .filter(e => e.category === cat.key && e.date.startsWith(thisMonth))
      .reduce((sum, e) => sum + e.amount, 0)
    
    return {
      category: cat.key,
      label: cat.label,
      percentage,
      allocated,
      spent,
      remaining: allocated - spent,
      color: cat.color,
    }
  })

  const addIncome = async (amount: number) => {
    if (!user) return
    await incomeApi.add({
      userId: user.id,
      amount,
      date: new Date().toISOString().slice(0, 10),
    })
    await refreshData()
  }

  const updateAllocations = async (updates: { category: BudgetCategory; percentage: number }[]) => {
    if (!user) return
    await allocationApi.updateAll(user.id, updates)
    await refreshData()
  }

  const addExpense = async (data: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) return
    await expenseApi.add({ ...data, userId: user.id })
    await refreshData()
  }

  const addSavedPayment = async (data: Omit<SavedPayment, 'id' | 'userId'>) => {
    if (!user) return
    await savedPaymentApi.add({ ...data, userId: user.id })
    await refreshData()
  }

  const updateSavedPayment = async (id: string, data: Partial<SavedPayment>) => {
    await savedPaymentApi.update(id, data)
    await refreshData()
  }

  const deleteSavedPayment = async (id: string) => {
    await savedPaymentApi.delete(id)
    await refreshData()
  }

  const processPayment = async (paymentId: string, amount: number) => {
    if (!user) return
    
    const payment = savedPayments.find(p => p.id === paymentId)
    if (!payment) return
    
    // Create approval request
    await approvalApi.create({
      userId: user.id,
      paymentId,
      status: 'pending',
    })
    
    // Create pending transaction
    await transactionApi.add({
      userId: user.id,
      paymentId,
      title: payment.name,
      amount,
      category: payment.category,
      status: 'pending',
      type: 'payment',
      date: new Date().toISOString().slice(0, 10),
    })
    
    await refreshData()
  }

  const approveRequest = async (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) return
    
    // Update approval status
    await approvalApi.updateStatus(requestId, 'approved')
    
    // Update transaction status
    const transaction = transactions.find(t => t.paymentId === request.paymentId && t.status === 'pending')
    if (transaction) {
      await transactionApi.updateStatus(transaction.id, 'approved')
    }
    
    await refreshData()
  }

  const rejectRequest = async (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) return
    
    await approvalApi.updateStatus(requestId, 'rejected')
    
    const transaction = transactions.find(t => t.paymentId === request.paymentId && t.status === 'pending')
    if (transaction) {
      await transactionApi.updateStatus(transaction.id, 'rejected')
    }
    
    await refreshData()
  }

  const markNotificationRead = async (id: string) => {
    await notificationApi.markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <FinanceContext.Provider value={{
      income,
      allocations,
      expenses,
      savedPayments,
      transactions,
      approvalRequests,
      notifications,
      budgetSummary,
      isLoading,
      refreshData,
      addIncome,
      updateAllocations,
      addExpense,
      addSavedPayment,
      updateSavedPayment,
      deleteSavedPayment,
      processPayment,
      approveRequest,
      rejectRequest,
      markNotificationRead,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
