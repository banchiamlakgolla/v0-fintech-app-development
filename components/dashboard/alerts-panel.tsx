'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/context/finance-context'
import { AlertTriangle, Bell, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, parseISO } from 'date-fns'

export function AlertsPanel() {
  const { notifications, budgetSummary, markNotificationRead } = useFinance()

  // Generate budget warnings
  const budgetWarnings = budgetSummary
    .filter(b => b.allocated > 0 && b.spent / b.allocated >= 0.75)
    .map(b => ({
      id: `budget-${b.category}`,
      type: b.spent >= b.allocated ? 'alert' : 'warning',
      title: b.spent >= b.allocated ? 'Budget Exceeded' : 'Budget Warning',
      message: `${b.label}: ${Math.round((b.spent / b.allocated) * 100)}% used`,
    }))

  const allAlerts = [
    ...budgetWarnings,
    ...notifications.filter(n => !n.read).slice(0, 3).map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true }),
      isNotification: true,
    })),
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'reminder':
        return <Bell className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'warning':
        return 'bg-warning/10 text-warning-foreground border-warning/20'
      case 'reminder':
        return 'bg-primary/10 text-primary border-primary/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Alerts & Reminders</CardTitle>
        <Bell className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {allAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-success mb-3" />
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground">No alerts or reminders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-opacity hover:opacity-80',
                  getColors(alert.type)
                )}
                onClick={() => {
                  if (alert.isNotification) {
                    markNotificationRead(alert.id)
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(alert.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs opacity-80">{alert.message}</p>
                    {alert.time && (
                      <p className="text-xs opacity-60 mt-1">{alert.time}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
