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
import { SUGGESTED_CATEGORIES, type BudgetCategory } from '@/lib/types'
import { PieChart, Save, Plus, X, Loader2, AlertCircle } from 'lucide-react'
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

interface AllocationItem {
  category: BudgetCategory
  label: string
  percentage: number
  color: string
}

export default function BudgetPage() {
  const { income, allocations, budgetSummary, setAllocations, hasIncome, hasAllocations } = useFinance()
  const [viewByAmount, setViewByAmount] = useState(false)
  const [localAllocations, setLocalAllocations] = useState<AllocationItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (allocations.length > 0) {
      const items = allocations.map((a, index) => {
        const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === a.category)
        return {
          category: a.category,
          label: categoryInfo?.label || a.category,
          percentage: a.percentage,
          color: categoryInfo?.color || SUGGESTED_CATEGORIES[index % SUGGESTED_CATEGORIES.length].color,
        }
      })
      setLocalAllocations(items)
    }
  }, [allocations])

  const totalPercentage = localAllocations.reduce((sum, a) => sum + a.percentage, 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01
  const availableCategories = SUGGESTED_CATEGORIES.filter(
    c => !localAllocations.some(a => a.category === c.key)
  )

  const addCategory = (category: BudgetCategory) => {
    const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === category)
    if (!categoryInfo) return
    
    setLocalAllocations(prev => [...prev, {
      category,
      label: categoryInfo.label,
      percentage: 0,
      color: categoryInfo.color,
    }])
    setHasChanges(true)
  }

  const removeCategory = (category: BudgetCategory) => {
    setLocalAllocations(prev => prev.filter(a => a.category !== category))
    setHasChanges(true)
  }

  const handlePercentageChange = (category: BudgetCategory, value: number) => {
    setLocalAllocations(prev => prev.map(a => 
      a.category === category ? { ...a, percentage: Math.max(0, Math.min(100, value)) } : a
    ))
    setHasChanges(true)
  }

  const handleAmountChange = (category: BudgetCategory, amount: number) => {
    if (income <= 0) return
    const percentage = (amount / income) * 100
    handlePercentageChange(category, percentage)
  }

  const handleSave = async () => {
    if (!isValid || localAllocations.length === 0) return
    setIsLoading(true)
    try {
      const updates = localAllocations.map(a => ({
        category: a.category,
        percentage: a.percentage,
      }))
      await setAllocations(updates)
      setHasChanges(false)
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = localAllocations.map((alloc, index) => ({
    name: alloc.label,
    value: alloc.percentage || 0,
    amount: (income * (alloc.percentage || 0)) / 100,
    fill: COLORS[index % COLORS.length],
  }))

  // Empty state for no income
  if (!hasIncome) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Budget Allocation"
          description="Customize how your income is distributed"
        />
        <div className="flex-1 p-4 lg:p-8">
          <Card className="border-border/50 border-dashed">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No income set</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  Please set your monthly income first before configuring budget allocations.
                </p>
                <Button asChild>
                  <a href="/dashboard/income">Go to Income</a>
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
              <CardTitle className="text-lg">Your Allocations</CardTitle>
              <CardDescription>
                Add categories and set how much to allocate to each
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Category Buttons */}
              {availableCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Add Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map(cat => (
                      <Button
                        key={cat.key}
                        variant="outline"
                        size="sm"
                        onClick={() => addCategory(cat.key)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Allocation Items */}
              {localAllocations.length > 0 ? (
                <div className="space-y-4">
                  {localAllocations.map((alloc, index) => {
                    const amount = (income * alloc.percentage) / 100

                    return (
                      <div key={alloc.category} className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <Label className="font-medium">{alloc.label}</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            {viewByAmount ? (
                              <Input
                                type="number"
                                className="w-28 text-right"
                                value={Math.round(amount) || ''}
                                onChange={(e) => handleAmountChange(alloc.category, parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            ) : (
                              <Input
                                type="number"
                                className="w-20 text-right"
                                value={alloc.percentage || ''}
                                onChange={(e) => handlePercentageChange(alloc.category, parseFloat(e.target.value) || 0)}
                                min={0}
                                max={100}
                                placeholder="0"
                              />
                            )}
                            <span className="text-sm text-muted-foreground w-8">
                              {viewByAmount ? 'ETB' : '%'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeCategory(alloc.category)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {!viewByAmount && (
                          <Slider
                            value={[alloc.percentage]}
                            onValueChange={([value]) => handlePercentageChange(alloc.category, value)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {viewByAmount
                            ? `${alloc.percentage.toFixed(1)}% of income`
                            : formatCurrency(amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No categories added yet.</p>
                  <p className="text-sm">Click a category above to add it.</p>
                </div>
              )}

              {/* Total */}
              {localAllocations.length > 0 && (
                <>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className={`font-semibold ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                        {totalPercentage.toFixed(1)}%
                      </span>
                    </div>
                    {!isValid && (
                      <p className="text-sm text-destructive mt-1">
                        {totalPercentage < 100 
                          ? `${(100 - totalPercentage).toFixed(1)}% remaining to allocate`
                          : `${(totalPercentage - 100).toFixed(1)}% over budget`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={!isValid || !hasChanges || isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
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
              {localAllocations.length > 0 ? (
                <>
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
                            `${value.toFixed(1)}% (${formatCurrency(props.payload.amount)})`,
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
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground truncate">
                          {item.name}: {item.value.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Add categories to see the preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        {budgetSummary.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Budget Summary</CardTitle>
              <CardDescription>
                Current allocation status based on your saved settings
              </CardDescription>
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
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-foreground">{item.label}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-foreground">{item.percentage.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4 text-foreground">{formatCurrency(item.allocated)}</td>
                        <td className="text-right py-3 px-4 text-foreground">{formatCurrency(item.spent)}</td>
                        <td className={`text-right py-3 px-4 font-medium ${item.remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(item.remaining)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
