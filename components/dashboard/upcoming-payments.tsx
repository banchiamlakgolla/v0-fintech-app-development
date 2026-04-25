'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFinance } from '@/context/finance-context'
import { Calendar, CreditCard } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export function UpcomingPayments() {
  const { savedPayments } = useFinance()

  const today = new Date()
  const upcomingPayments = savedPayments
    .filter(payment => {
      const dueDate = parseISO(payment.dueDate)
      const daysUntilDue = differenceInDays(dueDate, today)
      return daysUntilDue >= 0 && daysUntilDue <= 30
    })
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
    .slice(0, 5)

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Upcoming Payments</CardTitle>
        <CreditCard className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {upcomingPayments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No upcoming payments
          </p>
        ) : (
          <div className="space-y-4">
            {upcomingPayments.map((payment) => {
              const dueDate = parseISO(payment.dueDate)
              const daysUntilDue = differenceInDays(dueDate, today)

              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{payment.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(dueDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.defaultAmount)}
                    </p>
                    <Badge
                      variant={daysUntilDue <= 3 ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {daysUntilDue === 0
                        ? 'Due today'
                        : daysUntilDue === 1
                        ? 'Due tomorrow'
                        : `${daysUntilDue} days`}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
