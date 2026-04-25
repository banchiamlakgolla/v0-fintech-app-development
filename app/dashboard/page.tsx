'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/context/finance-context'
import { useAuth } from '@/context/auth-context'
import { BudgetChart } from '@/components/dashboard/budget-chart'
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { Wallet, TrendingUp, PiggyBank, AlertTriangle } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { income, budgetSummary } = useFinance()

  const totalSpent = budgetSummary.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = income - totalSpent
  const savingsAmount = budgetSummary.find(b => b.category === 'savings')?.allocated || 0

  const stats = [
    {
      title: 'Total Income',
      value: formatCurrency(income),
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: TrendingUp,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Savings Goal',
      value: formatCurrency(savingsAmount),
      icon: PiggyBank,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Remaining',
      value: formatCurrency(totalRemaining),
      icon: AlertTriangle,
      color: totalRemaining < 0 ? 'text-destructive' : 'text-success',
      bgColor: totalRemaining < 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'User'}`}
        description="Here's your financial overview"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BudgetChart />
          </div>
          <div>
            <AlertsPanel />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingPayments />
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
