'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinance } from '@/context/finance-context'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ETB'
}

export function BudgetChart() {
  const { budgetSummary, income } = useFinance()

  const chartData = budgetSummary.map((item, index) => ({
    name: item.label,
    value: item.allocated,
    percentage: item.percentage,
    spent: item.spent,
    remaining: item.remaining,
    fill: COLORS[index % COLORS.length],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Allocated: {formatCurrency(data.value)} ({data.percentage}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Spent: {formatCurrency(data.spent)}
          </p>
          <p className="text-sm text-muted-foreground">
            Remaining: {formatCurrency(data.remaining)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/50 h-full">
      <CardHeader>
        <CardTitle className="text-lg">Budget Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {income > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Add income to see budget distribution
          </div>
        )}
      </CardContent>
    </Card>
  )
}
