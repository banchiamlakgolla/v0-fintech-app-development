'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFinance } from '@/context/finance-context'
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export function RecentTransactions() {
  const { transactions } = useFinance()

  const recentTransactions = transactions.slice(0, 5)

  const statusColors = {
    pending: 'bg-warning/10 text-warning-foreground border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <History className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      transaction.type === 'expense'
                        ? 'bg-destructive/10'
                        : 'bg-primary/10'
                    )}
                  >
                    {transaction.type === 'expense' ? (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.category} • {format(parseISO(transaction.date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    -{formatCurrency(transaction.amount)}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn('text-xs capitalize', statusColors[transaction.status])}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
