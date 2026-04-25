import type {
  User,
  Income,
  Allocation,
  Expense,
  SavedPayment,
  Transaction,
  ApprovalRequest,
  OTP,
  Notification,
  BudgetCategory,
  Goal,
} from './types'

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15)

// Mock data storage (simulates backend)
let users: User[] = []
let incomes: Income[] = []
let allocations: Allocation[] = []
let expenses: Expense[] = []
let savedPayments: SavedPayment[] = []
let transactions: Transaction[] = []
let approvalRequests: ApprovalRequest[] = []
let otps: OTP[] = []
let notifications: Notification[] = []
let goals: Goal[] = []

// No demo data initialization - users start with zero state

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ============= USER API =============
export const userApi = {
  async register(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await delay(300)
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    users.push(user)
    return user
  },
  
  async getById(id: string): Promise<User | undefined> {
    await delay(100)
    return users.find(u => u.id === id)
  },
  
  async getByEmail(email: string): Promise<User | undefined> {
    await delay(100)
    return users.find(u => u.email === email)
  },
  
  async verifyPin(userId: string, pin: string): Promise<boolean> {
    await delay(200)
    const user = users.find(u => u.id === userId)
    return user?.pin === pin
  },
}

// ============= OTP API =============
export const otpApi = {
  async send(emailOrPhone: string): Promise<{ success: boolean; userId?: string }> {
    await delay(500)
    let user = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone)
    
    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const otp: OTP = {
      id: generateId(),
      userId: user?.id || 'temp',
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }
    otps.push(otp)
    
    // In real app, send via SMS/email
    console.log(`[Mock OTP] Code for ${emailOrPhone}: ${code}`)
    
    return { success: true, userId: user?.id }
  },
  
  async verify(emailOrPhone: string, code: string): Promise<{ success: boolean; user?: User }> {
    await delay(300)
    const user = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone)
    const otp = otps.find(o => 
      (o.userId === user?.id || o.userId === 'temp') && 
      o.code === code && 
      new Date(o.expiresAt) > new Date()
    )
    
    if (otp) {
      // Remove used OTP
      otps = otps.filter(o => o.id !== otp.id)
      return { success: true, user }
    }
    
    return { success: false }
  },
}

// ============= INCOME API =============
export const incomeApi = {
  async get(userId: string): Promise<Income[]> {
    await delay(200)
    return incomes.filter(i => i.userId === userId)
  },
  
  async add(data: Omit<Income, 'id'>): Promise<Income> {
    await delay(300)
    const income: Income = {
      ...data,
      id: generateId(),
    }
    incomes.push(income)
    return income
  },
  
  async update(id: string, amount: number): Promise<Income | undefined> {
    await delay(200)
    const index = incomes.findIndex(i => i.id === id)
    if (index !== -1) {
      incomes[index].amount = amount
      return incomes[index]
    }
    return undefined
  },
  
  // Set or replace monthly income (replaces all income for the month)
  async setMonthlyIncome(userId: string, amount: number): Promise<Income> {
    await delay(300)
    const thisMonth = new Date().toISOString().slice(0, 7)
    
    // Remove existing income for this month
    incomes = incomes.filter(i => !(i.userId === userId && i.date.startsWith(thisMonth)))
    
    // Add new income
    const income: Income = {
      id: generateId(),
      userId,
      amount,
      date: `${thisMonth}-01`,
    }
    incomes.push(income)
    return income
  },
  
  async getCurrentMonth(userId: string): Promise<number> {
    await delay(100)
    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthlyIncome = incomes
      .filter(i => i.userId === userId && i.date.startsWith(thisMonth))
      .reduce((sum, i) => sum + i.amount, 0)
    return monthlyIncome
  },
  
  async hasIncome(userId: string): Promise<boolean> {
    await delay(50)
    return incomes.some(i => i.userId === userId)
  },
}

// ============= ALLOCATION API =============
export const allocationApi = {
  async get(userId: string): Promise<Allocation[]> {
    await delay(200)
    return allocations.filter(a => a.userId === userId)
  },
  
  async add(data: Omit<Allocation, 'id'>): Promise<Allocation> {
    await delay(200)
    // Check if category already exists for user
    const existing = allocations.find(a => a.userId === data.userId && a.category === data.category)
    if (existing) {
      existing.percentage = data.percentage
      return existing
    }
    
    const allocation: Allocation = {
      ...data,
      id: generateId(),
    }
    allocations.push(allocation)
    return allocation
  },
  
  async remove(userId: string, category: BudgetCategory): Promise<boolean> {
    await delay(200)
    const initialLength = allocations.length
    allocations = allocations.filter(a => !(a.userId === userId && a.category === category))
    return allocations.length < initialLength
  },
  
  async update(id: string, percentage: number): Promise<Allocation | undefined> {
    await delay(200)
    const index = allocations.findIndex(a => a.id === id)
    if (index !== -1) {
      allocations[index].percentage = percentage
      return allocations[index]
    }
    return undefined
  },
  
  async updateAll(userId: string, updates: { category: BudgetCategory; percentage: number }[]): Promise<Allocation[]> {
    await delay(300)
    updates.forEach(update => {
      const index = allocations.findIndex(a => a.userId === userId && a.category === update.category)
      if (index !== -1) {
        allocations[index].percentage = update.percentage
      }
    })
    return allocations.filter(a => a.userId === userId)
  },
  
  async setAll(userId: string, allocs: { category: BudgetCategory; percentage: number }[]): Promise<Allocation[]> {
    await delay(300)
    // Remove all existing allocations for user
    allocations = allocations.filter(a => a.userId !== userId)
    
    // Add new allocations
    const newAllocations = allocs.map(alloc => ({
      id: generateId(),
      userId,
      category: alloc.category,
      percentage: alloc.percentage,
    }))
    allocations.push(...newAllocations)
    return newAllocations
  },
  
  async hasAllocations(userId: string): Promise<boolean> {
    await delay(50)
    return allocations.some(a => a.userId === userId)
  },
}

// ============= EXPENSE API =============
export const expenseApi = {
  async get(userId: string): Promise<Expense[]> {
    await delay(200)
    return expenses.filter(e => e.userId === userId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  },
  
  async add(data: Omit<Expense, 'id'>): Promise<Expense> {
    await delay(300)
    const expense: Expense = {
      ...data,
      id: generateId(),
    }
    expenses.push(expense)
    
    // Also create a transaction record
    transactions.push({
      id: generateId(),
      userId: data.userId,
      expenseId: expense.id,
      title: data.title,
      amount: data.amount,
      category: data.category,
      status: 'approved',
      type: 'expense',
      date: data.date,
    })
    
    return expense
  },
  
  async getByCategory(userId: string, category: BudgetCategory): Promise<number> {
    await delay(100)
    const thisMonth = new Date().toISOString().slice(0, 7)
    return expenses
      .filter(e => e.userId === userId && e.category === category && e.date.startsWith(thisMonth))
      .reduce((sum, e) => sum + e.amount, 0)
  },
}

// ============= SAVED PAYMENT API =============
export const savedPaymentApi = {
  async get(userId: string): Promise<SavedPayment[]> {
    await delay(200)
    return savedPayments.filter(p => p.userId === userId)
  },
  
  async add(data: Omit<SavedPayment, 'id'>): Promise<SavedPayment> {
    await delay(300)
    const payment: SavedPayment = {
      ...data,
      id: generateId(),
    }
    savedPayments.push(payment)
    return payment
  },
  
  async update(id: string, data: Partial<SavedPayment>): Promise<SavedPayment | undefined> {
    await delay(200)
    const index = savedPayments.findIndex(p => p.id === id)
    if (index !== -1) {
      savedPayments[index] = { ...savedPayments[index], ...data }
      return savedPayments[index]
    }
    return undefined
  },
  
  async delete(id: string): Promise<boolean> {
    await delay(200)
    const initialLength = savedPayments.length
    savedPayments = savedPayments.filter(p => p.id !== id)
    return savedPayments.length < initialLength
  },
}

// ============= TRANSACTION API =============
export const transactionApi = {
  async get(userId: string): Promise<Transaction[]> {
    await delay(200)
    return transactions.filter(t => t.userId === userId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  },
  
  async add(data: Omit<Transaction, 'id'>): Promise<Transaction> {
    await delay(300)
    const transaction: Transaction = {
      ...data,
      id: generateId(),
    }
    transactions.push(transaction)
    return transaction
  },
  
  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<Transaction | undefined> {
    await delay(200)
    const index = transactions.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions[index].status = status
      return transactions[index]
    }
    return undefined
  },
}

// ============= APPROVAL REQUEST API =============
export const approvalApi = {
  async get(userId: string): Promise<ApprovalRequest[]> {
    await delay(200)
    return approvalRequests.filter(a => a.userId === userId)
  },
  
  async create(data: Omit<ApprovalRequest, 'id' | 'requestedAt'>): Promise<ApprovalRequest> {
    await delay(300)
    const request: ApprovalRequest = {
      ...data,
      id: generateId(),
      requestedAt: new Date().toISOString(),
    }
    approvalRequests.push(request)
    return request
  },
  
  async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<ApprovalRequest | undefined> {
    await delay(200)
    const index = approvalRequests.findIndex(a => a.id === id)
    if (index !== -1) {
      approvalRequests[index].status = status
      if (status === 'approved') {
        approvalRequests[index].approvedAt = new Date().toISOString()
      }
      return approvalRequests[index]
    }
    return undefined
  },
}

// ============= NOTIFICATION API =============
export const notificationApi = {
  async get(userId: string): Promise<Notification[]> {
    await delay(200)
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
  
  async markAsRead(id: string): Promise<void> {
    await delay(100)
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications[index].read = true
    }
  },
  
  async add(data: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    await delay(200)
    const notification: Notification = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    notifications.push(notification)
    return notification
  },
}

// ============= GOALS API =============
export const goalsApi = {
  async get(userId: string): Promise<Goal[]> {
    await delay(200)
    return goals.filter(g => g.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
  
  async getById(id: string): Promise<Goal | undefined> {
    await delay(100)
    return goals.find(g => g.id === id)
  },
  
  async add(data: Omit<Goal, 'id' | 'createdAt' | 'currentAmount' | 'status'>): Promise<Goal> {
    await delay(300)
    const goal: Goal = {
      ...data,
      id: generateId(),
      currentAmount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    goals.push(goal)
    return goal
  },
  
  async update(id: string, data: Partial<Goal>): Promise<Goal | undefined> {
    await delay(200)
    const index = goals.findIndex(g => g.id === id)
    if (index !== -1) {
      goals[index] = { ...goals[index], ...data }
      return goals[index]
    }
    return undefined
  },
  
  async delete(id: string): Promise<boolean> {
    await delay(200)
    const initialLength = goals.length
    goals = goals.filter(g => g.id !== id)
    return goals.length < initialLength
  },
  
  async addFunds(id: string, amount: number): Promise<Goal | undefined> {
    await delay(200)
    const index = goals.findIndex(g => g.id === id)
    if (index !== -1) {
      goals[index].currentAmount += amount
      
      // Check if goal is completed
      if (goals[index].currentAmount >= goals[index].targetAmount) {
        goals[index].status = 'completed'
        goals[index].completedAt = new Date().toISOString()
      }
      
      return goals[index]
    }
    return undefined
  },
  
  async getByCategory(userId: string, category: string): Promise<Goal[]> {
    await delay(100)
    return goals.filter(g => g.userId === userId && g.category === category)
  },
}
