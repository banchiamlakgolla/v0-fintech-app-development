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
import { useFinance } from '@/context/finance-context'
import { Plus, Wallet, TrendingUp, Calendar, Loader2 } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function IncomePage() {
  const { income, budgetSummary, addIncome } = useFinance()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newIncome, setNewIncome] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAddIncome = async () => {
    const amount = parseFloat(newIncome)
    if (isNaN(amount) || amount <= 0) return

    setIsLoading(true)
    try {
      await addIncome(amount)
      setNewIncome('')
      setIsDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Income Management"
        description="Track and manage your monthly income"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Current Income Card */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Monthly Income</CardTitle>
                <CardDescription>{currentMonth}</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Income</DialogTitle>
                    <DialogDescription>
                      Enter the amount to add to your monthly income
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (ETB)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={newIncome}
                        onChange={(e) => setNewIncome(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddIncome} disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Income
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-bold text-foreground">
                  {formatCurrency(income)}
                </p>
                <p className="text-muted-foreground">Total income this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Allocation Summary */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Automatic Budget Allocation</CardTitle>
            <CardDescription>
              Your income is automatically distributed across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetSummary.map((budget) => (
                <div
                  key={budget.category}
                  className="p-4 rounded-xl border border-border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground">{budget.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {budget.percentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {formatCurrency(budget.allocated)}
                  </p>
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((budget.spent / budget.allocated) * 100, 100)}%`,
                        backgroundColor: budget.spent > budget.allocated ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Left: {formatCurrency(budget.remaining)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Budget Tip</h3>
                <p className="text-sm text-muted-foreground">
                  Following the 40-20-15-15-10 rule helps ensure you cover essential expenses 
                  while saving for the future. Adjust your allocations in the Budget section 
                  to match your financial goals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
