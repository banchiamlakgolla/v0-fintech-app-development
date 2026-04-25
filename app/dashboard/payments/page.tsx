'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useFinance } from '@/context/finance-context'
import { useAuth } from '@/context/auth-context'
import { userApi } from '@/lib/api'
import { SUGGESTED_CATEGORIES, type BudgetCategory, type SavedPayment } from '@/lib/types'
import { 
  Plus, 
  CreditCard, 
  Calendar, 
  Trash2, 
  Edit2, 
  Send,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  Clock
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

export default function PaymentsPage() {
  const { user } = useAuth()
  const { 
    savedPayments, 
    budgetSummary, 
    approvalRequests,
    allocations,
    hasAllocations,
    addSavedPayment, 
    updateSavedPayment, 
    deleteSavedPayment,
    processPayment,
    approveRequest,
    rejectRequest
  } = useFinance()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<SavedPayment | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    category: '' as BudgetCategory | '',
    defaultAmount: '',
    dueDate: '',
    autoPay: false,
    frequency: 'monthly' as 'weekly' | 'monthly',
  })

  const handleAddPayment = async () => {
    if (!formData.name || !formData.accountNumber || !formData.category || !formData.defaultAmount) return
    
    setIsLoading(true)
    try {
      await addSavedPayment({
        name: formData.name,
        accountNumber: formData.accountNumber,
        category: formData.category,
        defaultAmount: parseFloat(formData.defaultAmount),
        dueDate: formData.dueDate || new Date().toISOString().slice(0, 10),
        autoPay: formData.autoPay,
        frequency: formData.autoPay ? formData.frequency : undefined,
      })
      setFormData({
        name: '',
        accountNumber: '',
        category: '',
        defaultAmount: '',
        dueDate: '',
        autoPay: false,
        frequency: 'monthly',
      })
      setIsAddDialogOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPayment = (payment: SavedPayment) => {
    setSelectedPayment(payment)
    setPayAmount(payment.defaultAmount.toString())
    setIsPayDialogOpen(true)
  }

  const handleProceedToPin = () => {
    setIsPayDialogOpen(false)
    setIsPinDialogOpen(true)
  }

  const handleVerifyPin = async () => {
    if (!user || !selectedPayment) return
    
    setIsLoading(true)
    setPinError('')
    
    try {
      const isValid = await userApi.verifyPin(user.id, pin)
      
      if (isValid) {
        await processPayment(selectedPayment.id, parseFloat(payAmount))
        setIsPinDialogOpen(false)
        setPin('')
        setSelectedPayment(null)
      } else {
        setPinError('Invalid PIN. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePayment = async (id: string) => {
    await deleteSavedPayment(id)
  }

  const handleApproveRequest = async (requestId: string) => {
    setIsLoading(true)
    try {
      await approveRequest(requestId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setIsLoading(true)
    try {
      await rejectRequest(requestId)
    } finally {
      setIsLoading(false)
    }
  }

  const pendingRequests = approvalRequests.filter(r => r.status === 'pending')

  const getBudgetForCategory = (category: BudgetCategory) => {
    return budgetSummary.find(b => b.category === category)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Payments"
        description="Manage saved payments and approvals"
      />

      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Pending Approvals */}
        {pendingRequests.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Pending Approvals ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                Payments waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => {
                  const payment = savedPayments.find(p => p.id === request.paymentId)
                  if (!payment) return null

                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{payment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.accountNumber} • {formatCurrency(payment.defaultAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={isLoading}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Payments */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Saved Payments</CardTitle>
              <CardDescription>Quick access to recurring payments</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Saved Payment</DialogTitle>
                  <DialogDescription>
                    Create a payment template for quick future use
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Payment Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., University Tuition"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number / ID</Label>
                    <Input
                      id="accountNumber"
                      placeholder="e.g., EDU-2024-001"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as BudgetCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {allocations.map((alloc) => {
                          const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === alloc.category)
                          return (
                            <SelectItem key={alloc.category} value={alloc.category}>
                              {categoryInfo?.label || alloc.category}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultAmount">Default Amount (ETB)</Label>
                    <Input
                      id="defaultAmount"
                      type="number"
                      placeholder="0.00"
                      value={formData.defaultAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultAmount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="autoPay">Enable Auto-Pay</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically process this payment on due date
                      </p>
                    </div>
                    <Switch
                      id="autoPay"
                      checked={formData.autoPay}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoPay: checked }))}
                    />
                  </div>
                  {formData.autoPay && (
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value as 'weekly' | 'monthly' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddPayment} 
                    disabled={!formData.name || !formData.accountNumber || !formData.category || !formData.defaultAmount || isLoading}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {savedPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No saved payments yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create payment templates for quick recurring payments
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPayments.map((payment) => {
                  const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === payment.category)
                  
                  return (
                    <div
                      key={payment.id}
                      className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{payment.name}</p>
                            <p className="text-xs text-muted-foreground">{payment.accountNumber}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(payment.defaultAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Category</span>
                          <span className="capitalize text-foreground">{categoryInfo?.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Due Date</span>
                          <span className="text-foreground">
                            {format(parseISO(payment.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {payment.autoPay && (
                          <Badge variant="secondary" className="text-xs">
                            Auto-Pay {payment.frequency}
                          </Badge>
                        )}
                      </div>

                      <Button 
                        className="w-full mt-4" 
                        onClick={() => handleSelectPayment(payment)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Confirmation Dialog */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                Review the payment details before proceeding
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium text-foreground">{selectedPayment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium text-foreground">{selectedPayment.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground capitalize">
                      {SUGGESTED_CATEGORIES.find(c => c.key === selectedPayment.category)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Budget</span>
                    <span className={cn(
                      'font-medium',
                      (getBudgetForCategory(selectedPayment.category)?.remaining || 0) < parseFloat(payAmount)
                        ? 'text-destructive'
                        : 'text-success'
                    )}>
                      {formatCurrency(getBudgetForCategory(selectedPayment.category)?.remaining || 0)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payAmount">Amount (ETB)</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProceedToPin}>
                <Shield className="w-4 h-4 mr-2" />
                Proceed to PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PIN Verification Dialog */}
        <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter PIN</DialogTitle>
              <DialogDescription>
                Enter your 4-digit PIN to authorize this payment
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={setPin}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              {pinError && (
                <p className="text-sm text-destructive mt-4">{pinError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsPinDialogOpen(false); setPin(''); setPinError(''); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyPin} 
                disabled={pin.length !== 4 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
