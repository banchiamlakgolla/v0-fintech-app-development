'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { useFinance } from '@/context/finance-context'
import { BUDGET_CATEGORIES, type BudgetCategory } from '@/lib/types'
import { PieChart, Save, RotateCcw, Loader2 } from 'lucide-react'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function BudgetPage() {
  const { income, allocations, budgetSummary, updateAllocations } = useFinance()
  const [viewByAmount, setViewByAmount] = useState(false)
  const [localAllocations, setLocalAllocations] = useState<Record<BudgetCategory, number>>({
    expenses: 40,
    savings: 20,
    education: 15,
    personal: 15,
    emergency: 10,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (allocations.length > 0) {
      const allocs: Record<BudgetCategory, number> = {} as any
      allocations.forEach(a => {
        allocs[a.category] = a.percentage
      })
      setLocalAllocations(allocs)
    }
  }, [allocations])

  const totalPercentage = Object.values(localAllocations).reduce((sum, val) => sum + val, 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01

  const handlePercentageChange = (category: BudgetCategory, value: number) => {
    setLocalAllocations(prev => ({ ...prev, [category]: value }))
    setHasChanges(true)
  }

  const handleAmountChange = (category: BudgetCategory, amount: number) => {
    if (income <= 0) return
    const percentage = Math.round((amount / income) * 100)
    handlePercentageChange(category, Math.max(0, Math.min(100, percentage)))
  }

  const handleSave = async () => {
    if (!isValid) return
    setIsLoading(true)
    try {
      const updates = Object.entries(localAllocations).map(([category, percentage]) => ({
        category: category as BudgetCategory,
        percentage,
      }))
      await updateAllocations(updates)
      setHasChanges(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const defaults: Record<BudgetCategory, number> = {
      expenses: 40,
      savings: 20,
      education: 15,
      personal: 15,
      emergency: 10,
    }
    setLocalAllocations(defaults)
    setHasChanges(true)
  }

  const chartData = BUDGET_CATEGORIES.map((cat, index) => ({
    name: cat.label,
    value: localAllocations[cat.key] || 0,
    amount: (income * (localAllocations[cat.key] || 0)) / 100,
    fill: COLORS[index],
  }))

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Budget Allocation"
        description="Customize how your income is distributed"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* View Toggle */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PieChart className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">View Mode</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!viewByAmount ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Percentage (%)
                </span>
                <Switch
                  checked={viewByAmount}
                  onCheckedChange={setViewByAmount}
                />
                <span className={`text-sm ${viewByAmount ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Amount (ETB)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Allocation Controls */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Adjust Allocations</CardTitle>
              <CardDescription>
                {viewByAmount
                  ? 'Enter amounts in ETB (percentages will be calculated)'
                  : 'Adjust percentages using sliders or input fields'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {BUDGET_CATEGORIES.map((cat, index) => {
                const percentage = localAllocations[cat.key] || 0
                const amount = (income * percentage) / 100

                return (
                  <div key={cat.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <Label className="font-medium">{cat.label}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {viewByAmount ? (
                          <Input
                            type="number"
                            className="w-32 text-right"
                            value={Math.round(amount)}
                            onChange={(e) => handleAmountChange(cat.key, parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <Input
                            type="number"
                            className="w-20 text-right"
                            value={percentage}
                            onChange={(e) => handlePercentageChange(cat.key, parseFloat(e.target.value) || 0)}
                            min={0}
                            max={100}
                          />
                        )}
                        <span className="text-sm text-muted-foreground w-12">
                          {viewByAmount ? 'ETB' : '%'}
                        </span>
                      </div>
                    </div>
                    {!viewByAmount && (
                      <Slider
                        value={[percentage]}
                        onValueChange={([value]) => handlePercentageChange(cat.key, value)}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {viewByAmount
                        ? `${percentage}% of income`
                        : formatCurrency(amount)}
                    </p>
                  </div>
                )
              })}

              {/* Total */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className={`font-semibold ${isValid ? 'text-success' : 'text-destructive'}`}>
                    {totalPercentage}%
                  </span>
                </div>
                {!isValid && (
                  <p className="text-sm text-destructive mt-1">
                    Allocations must total 100%
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isValid || !hasChanges || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Allocation Preview</CardTitle>
              <CardDescription>
                Visual representation of your budget distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% (${formatCurrency(props.payload.amount)})`,
                        name,
                      ]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-muted-foreground truncate">
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Percentage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Allocated</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Spent</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSummary.map((item, index) => (
                    <tr key={item.category} className="border-b border-border/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="font-medium text-foreground">{item.label}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-foreground">{item.percentage}%</td>
                      <td className="text-right py-3 px-4 text-foreground">{formatCurrency(item.allocated)}</td>
                      <td className="text-right py-3 px-4 text-foreground">{formatCurrency(item.spent)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${item.remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                        {formatCurrency(item.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
