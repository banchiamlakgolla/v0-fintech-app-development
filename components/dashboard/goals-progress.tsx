'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useFinance } from '@/context/finance-context'
import { getCategoryInfo } from '@/lib/types'
import { Target, ArrowRight, CheckCircle2, Plus } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function GoalsProgress() {
  const { goals, allocations } = useFinance()

  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3)
  const completedCount = goals.filter(g => g.status === 'completed').length

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Goals Progress</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/goals" className="text-primary">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length > 0 ? (
          <>
            {activeGoals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              const categoryInfo = getCategoryInfo(goal.category, allocations)
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryInfo.color }}
                      />
                      <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                        {goal.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-1.5" />
                    <div 
                      className="absolute inset-0 h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              )
            })}
            
            {completedCount > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">
                  {completedCount} goal{completedCount !== 1 ? 's' : ''} completed
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-10 h-10 mx-auto rounded-xl bg-muted flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No active goals yet</p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/goals">
                <Plus className="w-4 h-4 mr-1" />
                Create Goal
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
