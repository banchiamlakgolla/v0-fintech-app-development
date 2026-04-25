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
  Goal,
} from '@/lib/types'
import { SUGGESTED_CATEGORIES, getCategoryInfo, CATEGORY_COLORS } from '@/lib/types'
import {
  incomeApi,
  allocationApi,
  expenseApi,
  savedPaymentApi,
  transactionApi,
  approvalApi,
  notificationApi,
  goalsApi,
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
  goals: Goal[]
  
  // Loading states
  isLoading: boolean
  
  // State checks
  hasData: boolean
  hasIncome: boolean
  hasAllocations: boolean
  
  // Actions
  refreshData: () => Promise<void>
  setIncome: (amount: number) => Promise<void>
  addIncome: (amount: number) => Promise<void>
  setAllocations: (allocs: { category: BudgetCategory; percentage: number }[]) => Promise<void>
  addAllocation: (category: BudgetCategory, percentage: number) => Promise<void>
  removeAllocation: (category: BudgetCategory) => Promise<void>
  updateAllocations: (updates: { category: BudgetCategory; percentage: number }[]) => Promise<void>
  addExpense: (data: Omit<Expense, 'id' | 'userId'>) => Promise<void>
  addSavedPayment: (data: Omit<SavedPayment, 'id' | 'userId'>) => Promise<void>
  updateSavedPayment: (id: string, data: Partial<SavedPayment>) => Promise<void>
  deleteSavedPayment: (id: string) => Promise<void>
  processPayment: (paymentId: string, amount: number) => Promise<void>
  approveRequest: (requestId: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  // Goals
  addGoal: (data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount' | 'status'>) => Promise<void>
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addFundsToGoal: (id: string, amount: number) => Promise<void>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  const [income, setIncomeState] = useState(0)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [savedPayments, setSavedPayments] = useState<SavedPayment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
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
        goalsData,
      ] = await Promise.all([
        incomeApi.getCurrentMonth(user.id),
        allocationApi.get(user.id),
        expenseApi.get(user.id),
        savedPaymentApi.get(user.id),
        transactionApi.get(user.id),
        approvalApi.get(user.id),
        notificationApi.get(user.id),
        goalsApi.get(user.id),
      ])
      
      setIncomeState(incomeData)
      setAllocations(allocationsData)
      setExpenses(expensesData)
      setSavedPayments(paymentsData)
      setTransactions(transactionsData)
      setApprovalRequests(approvalsData)
      setNotifications(notificationsData)
      setGoals(goalsData)
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Compute state checks
  const hasIncome = income > 0
  const hasAllocations = allocations.length > 0
  const hasData = hasIncome && hasAllocations

  // Calculate budget summary - only for allocated categories
  const budgetSummary: BudgetSummary[] = allocations.map((alloc, index) => {
    const categoryInfo = getCategoryInfo(alloc.category, allocations)
    const allocated = (income * alloc.percentage) / 100
    const thisMonth = new Date().toISOString().slice(0, 7)
    const spent = expenses
      .filter(e => e.category === alloc.category && e.date.startsWith(thisMonth))
      .reduce((sum, e) => sum + e.amount, 0)
    
    return {
      category: alloc.category,
      label: categoryInfo.label,
      percentage: alloc.percentage,
      allocated,
      spent,
      remaining: allocated - spent,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }
  })

  // Set income (replaces existing)
  const setIncome = async (amount: number) => {
    if (!user) return
    await incomeApi.setMonthlyIncome(user.id, amount)
    await refreshData()
  }

  // Add income (legacy - still adds)
  const addIncome = async (amount: number) => {
    if (!user) return
    await incomeApi.setMonthlyIncome(user.id, amount)
    await refreshData()
  }

  // Set all allocations at once (for onboarding)
  const setAllocationsAll = async (allocs: { category: BudgetCategory; percentage: number }[]) => {
    if (!user) return
    await allocationApi.setAll(user.id, allocs)
    await refreshData()
  }

  // Add a single allocation
  const addAllocation = async (category: BudgetCategory, percentage: number) => {
    if (!user) return
    await allocationApi.add({ userId: user.id, category, percentage })
    await refreshData()
  }

  // Remove an allocation
  const removeAllocation = async (category: BudgetCategory) => {
    if (!user) return
    await allocationApi.remove(user.id, category)
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

  // Goal actions
  const addGoal = async (data: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'currentAmount' | 'status'>) => {
    if (!user) return
    await goalsApi.add({ ...data, userId: user.id })
    await refreshData()
  }

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    await goalsApi.update(id, data)
    await refreshData()
  }

  const deleteGoal = async (id: string) => {
    await goalsApi.delete(id)
    await refreshData()
  }

  const addFundsToGoal = async (id: string, amount: number) => {
    if (!user) return
    const updatedGoal = await goalsApi.addFunds(id, amount)
    
    // Check if goal was completed and create notification
    if (updatedGoal && updatedGoal.status === 'completed') {
      await notificationApi.add({
        userId: user.id,
        title: 'Goal Achieved!',
        message: `Congratulations! You have achieved your goal: ${updatedGoal.name}`,
        type: 'info',
        read: false,
      })
    } else if (updatedGoal) {
      // Check if close to completion (90%)
      const progress = (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100
      if (progress >= 90 && progress < 100) {
        await notificationApi.add({
          userId: user.id,
          title: 'Almost There!',
          message: `You are ${Math.round(progress)}% towards your goal: ${updatedGoal.name}`,
          type: 'info',
          read: false,
        })
      }
    }
    
    await refreshData()
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
      goals,
      isLoading,
      hasData,
      hasIncome,
      hasAllocations,
      refreshData,
      setIncome,
      addIncome,
      setAllocations: setAllocationsAll,
      addAllocation,
      removeAllocation,
      updateAllocations,
      addExpense,
      addSavedPayment,
      updateSavedPayment,
      deleteSavedPayment,
      processPayment,
      approveRequest,
      rejectRequest,
      markNotificationRead,
      addGoal,
      updateGoal,
      deleteGoal,
      addFundsToGoal,
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
