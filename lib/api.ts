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
  BUDGET_CATEGORIES,
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

// Initialize with demo data
const initializeDemoData = (userId: string) => {
  const today = new Date()
  const thisMonth = today.toISOString().slice(0, 7)
  
  // Add demo income
  incomes.push({
    id: generateId(),
    userId,
    amount: 12500,
    date: `${thisMonth}-01`,
  })
  
  // Add default allocations
  const defaultAllocations: { category: BudgetCategory; percentage: number }[] = [
    { category: 'expenses', percentage: 40 },
    { category: 'savings', percentage: 20 },
    { category: 'education', percentage: 15 },
    { category: 'personal', percentage: 15 },
    { category: 'emergency', percentage: 10 },
  ]
  
  defaultAllocations.forEach(({ category, percentage }) => {
    allocations.push({
      id: generateId(),
      userId,
      category,
      percentage,
    })
  })
  
  // Add demo expenses
  expenses.push(
    {
      id: generateId(),
      userId,
      title: 'Groceries',
      amount: 850,
      category: 'expenses',
      date: `${thisMonth}-05`,
    },
    {
      id: generateId(),
      userId,
      title: 'Electricity Bill',
      amount: 320,
      category: 'expenses',
      date: `${thisMonth}-10`,
    },
    {
      id: generateId(),
      userId,
      title: 'Online Course',
      amount: 500,
      category: 'education',
      date: `${thisMonth}-08`,
    }
  )
  
  // Add demo saved payments
  savedPayments.push(
    {
      id: generateId(),
      userId,
      name: 'University Tuition',
      accountNumber: 'EDU-2024-001',
      category: 'education',
      defaultAmount: 1500,
      dueDate: `${thisMonth}-25`,
      autoPay: false,
    },
    {
      id: generateId(),
      userId,
      name: 'Monthly Rent',
      accountNumber: 'RENT-APT-42',
      category: 'expenses',
      defaultAmount: 2000,
      dueDate: `${thisMonth}-01`,
      autoPay: true,
      frequency: 'monthly',
    }
  )
  
  // Add demo notifications
  notifications.push(
    {
      id: generateId(),
      userId,
      title: 'Payment Due Soon',
      message: 'University Tuition payment is due in 2 days',
      type: 'reminder',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      userId,
      title: 'Budget Alert',
      message: 'You have used 75% of your Expenses budget',
      type: 'alert',
      read: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  )
}

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
    initializeDemoData(user.id)
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
  
  async getCurrentMonth(userId: string): Promise<number> {
    await delay(100)
    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthlyIncome = incomes
      .filter(i => i.userId === userId && i.date.startsWith(thisMonth))
      .reduce((sum, i) => sum + i.amount, 0)
    return monthlyIncome
  },
}

// ============= ALLOCATION API =============
export const allocationApi = {
  async get(userId: string): Promise<Allocation[]> {
    await delay(200)
    return allocations.filter(a => a.userId === userId)
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
