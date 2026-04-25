'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinance } from '@/context/finance-context'
import { SUGGESTED_CATEGORIES, getCategoryInfo } from '@/lib/types'
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Download
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function TransactionsPage() {
  const { transactions, allocations } = useFinance()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesType
  })

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, typeof transactions>)

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  // Calculate totals
  const totalExpenses = filteredTransactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const pendingAmount = filteredTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const statusColors = {
    pending: 'bg-warning/10 text-warning-foreground border-warning/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  const statusIcons = {
    pending: '...',
    approved: 'check',
    rejected: 'x',
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Transaction History"
        description="View all your financial transactions"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-semibold text-foreground">{filteredTransactions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-semibold text-warning">{formatCurrency(pendingAmount)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allocations.map((alloc) => {
                      const info = getCategoryInfo(alloc.category, allocations)
                      return (
                        <SelectItem key={alloc.category} value={alloc.category}>
                          {info.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your transactions will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-card py-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupedTransactions[date].map((transaction) => {
                        const categoryInfo = getCategoryInfo(transaction.category, allocations)
                        
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-full flex items-center justify-center',
                                  transaction.type === 'expense'
                                    ? 'bg-chart-3/10'
                                    : 'bg-primary/10'
                                )}
                              >
                                {transaction.type === 'expense' ? (
                                  <ArrowUpRight className="w-5 h-5 text-chart-3" />
                                ) : (
                                  <ArrowDownRight className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{transaction.title}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="capitalize">{categoryInfo?.label}</span>
                                  <span>•</span>
                                  <span className="capitalize">{transaction.type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
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
