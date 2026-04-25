'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinance } from '@/context/finance-context'
import { SUGGESTED_CATEGORIES, type BudgetCategory } from '@/lib/types'
import { Plus, Receipt, AlertTriangle, Loader2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function ExpensesPage() {
  const { expenses, budgetSummary, addExpense, hasAllocations, allocations } = useFinance()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '' as BudgetCategory | '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [warning, setWarning] = useState<string | null>(null)

  const handleCategoryChange = (category: BudgetCategory) => {
    setFormData(prev => ({ ...prev, category }))
    
    // Check if this would exceed budget
    const budget = budgetSummary.find(b => b.category === category)
    const amount = parseFloat(formData.amount) || 0
    
    if (budget && budget.spent + amount > budget.allocated) {
      setWarning(`This expense would exceed your ${budget.label} budget by ${formatCurrency(budget.spent + amount - budget.allocated)}`)
    } else {
      setWarning(null)
    }
  }

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value }))
    
    if (formData.category) {
      const budget = budgetSummary.find(b => b.category === formData.category)
      const amount = parseFloat(value) || 0
      
      if (budget && budget.spent + amount > budget.allocated) {
        setWarning(`This expense would exceed your ${budget.label} budget by ${formatCurrency(budget.spent + amount - budget.allocated)}`)
      } else {
        setWarning(null)
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount || !formData.category) return
    
    setIsLoading(true)
    try {
      await addExpense({
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
      })
      setFormData({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().slice(0, 10),
      })
      setWarning(null)
      setIsDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = expense.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {} as Record<string, typeof expenses>)

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  // Show empty state if no allocations
  if (!hasAllocations) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Expense Tracking"
          description="Monitor and manage your spending"
        />
        <div className="flex-1 p-4 lg:p-8">
          <Card className="border-border/50 border-dashed">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No budget allocations set</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  Please set up your budget allocations first before tracking expenses.
                </p>
                <Button asChild>
                  <a href="/dashboard/budget">Go to Budget</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Expense Tracking"
        description="Monitor and manage your spending"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Budget Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {budgetSummary.map((budget) => {
            const percentUsed = budget.allocated > 0 
              ? (budget.spent / budget.allocated) * 100 
              : 0
            const isOverBudget = percentUsed > 100
            const isWarning = percentUsed >= 75 && percentUsed < 100

            return (
              <Card 
                key={budget.category} 
                className={cn(
                  'border-border/50',
                  isOverBudget && 'border-destructive/50 bg-destructive/5',
                  isWarning && 'border-warning/50 bg-warning/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{budget.label}</span>
                    {(isOverBudget || isWarning) && (
                      <AlertTriangle className={cn(
                        'w-4 h-4',
                        isOverBudget ? 'text-destructive' : 'text-warning'
                      )} />
                    )}
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(budget.remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(percentUsed)}% used
                  </p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOverBudget ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Add Expense Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense to track your spending
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Groceries, Electricity Bill"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (ETB)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleCategoryChange(value as BudgetCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allocations.map((alloc) => {
                        const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === alloc.category)
                        return (
                          <SelectItem key={alloc.category} value={alloc.category}>
                            {categoryInfo?.label || alloc.category}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                {warning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-warning-foreground">{warning}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.title || !formData.amount || !formData.category || isLoading}
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Expense
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expenses List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
            <CardDescription>Your spending history</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No expenses recorded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first expense to start tracking
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupedExpenses[date].map((expense) => {
                        const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === expense.category)
                        return (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{expense.title}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {categoryInfo?.label || expense.category}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-foreground">
                              -{formatCurrency(expense.amount)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
