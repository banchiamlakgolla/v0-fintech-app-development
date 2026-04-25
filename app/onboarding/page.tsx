'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/context/auth-context'
import { incomeApi, allocationApi } from '@/lib/api'
import { SUGGESTED_CATEGORIES, CATEGORY_COLORS, type BudgetCategory } from '@/lib/types'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Wallet, 
  PieChart, 
  Sparkles,
  Plus,
  X,
  Loader2
} from 'lucide-react'

type OnboardingStep = 'welcome' | 'income' | 'allocation' | 'confirmation'

interface AllocationItem {
  category: BudgetCategory
  label: string
  value: number
  color: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ETB'
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, completeOnboarding, onboardingComplete } = useAuth()
  
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [income, setIncome] = useState('')
  const [usePercentage, setUsePercentage] = useState(true)
  const [allocations, setAllocations] = useState<AllocationItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Redirect if onboarding already complete
  useEffect(() => {
    if (!authLoading && onboardingComplete) {
      router.push('/dashboard')
    }
  }, [authLoading, onboardingComplete, router])

  const incomeAmount = parseFloat(income) || 0
  const totalAllocated = allocations.reduce((sum, a) => sum + a.value, 0)
  const isValidAllocation = usePercentage 
    ? Math.abs(totalAllocated - 100) < 0.01 
    : Math.abs(totalAllocated - incomeAmount) < 0.01

  const addCategory = (category: BudgetCategory, customLabel?: string) => {
    if (allocations.some(a => a.category === category)) return
    
    const categoryInfo = SUGGESTED_CATEGORIES.find(c => c.key === category)
    const colorIndex = allocations.length % CATEGORY_COLORS.length
    
    setAllocations(prev => [...prev, {
      category,
      label: customLabel || categoryInfo?.label || category,
      value: 0,
      color: categoryInfo?.color || CATEGORY_COLORS[colorIndex],
    }])
  }

  const addCustomCategory = () => {
    const trimmed = customCategoryName.trim()
    if (!trimmed) return
    
    // Create a key from the name (lowercase, no spaces)
    const key = trimmed.toLowerCase().replace(/\s+/g, '-')
    
    if (allocations.some(a => a.category === key)) {
      setError('This category already exists')
      return
    }
    
    addCategory(key, trimmed)
    setCustomCategoryName('')
    setShowCustomInput(false)
    setError('')
  }

  const removeCategory = (category: BudgetCategory) => {
    setAllocations(prev => prev.filter(a => a.category !== category))
  }

  const updateAllocationValue = (category: BudgetCategory, value: number) => {
    setAllocations(prev => prev.map(a => 
      a.category === category ? { ...a, value } : a
    ))
  }

  const handleNext = () => {
    setError('')
    
    if (step === 'welcome') {
      setStep('income')
    } else if (step === 'income') {
      if (incomeAmount <= 0) {
        setError('Please enter a valid income amount')
        return
      }
      setStep('allocation')
    } else if (step === 'allocation') {
      if (allocations.length === 0) {
        setError('Please add at least one budget category')
        return
      }
      if (!isValidAllocation) {
        setError(usePercentage 
          ? 'Total allocation must equal 100%' 
          : 'Total allocation must equal your income')
        return
      }
      setStep('confirmation')
    }
  }

  const handleBack = () => {
    setError('')
    if (step === 'income') setStep('welcome')
    else if (step === 'allocation') setStep('income')
    else if (step === 'confirmation') setStep('allocation')
  }

  const handleComplete = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Save income
      await incomeApi.setMonthlyIncome(user.id, incomeAmount)
      
      // Convert allocations to percentages if using amounts
      const allocationData = allocations.map(a => ({
        category: a.category,
        percentage: usePercentage ? a.value : (a.value / incomeAmount) * 100,
      }))
      
      // Save allocations
      await allocationApi.setAll(user.id, allocationData)
      
      // Mark onboarding as complete
      completeOnboarding()
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to save your financial plan. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgress = () => {
    switch (step) {
      case 'welcome': return 0
      case 'income': return 33
      case 'allocation': return 66
      case 'confirmation': return 100
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="p-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <Progress value={getProgress()} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Welcome</span>
            <span>Income</span>
            <span>Allocation</span>
            <span>Confirm</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Welcome Step */}
          {step === 'welcome' && (
            <Card className="border-border/50">
              <CardHeader className="text-center space-y-4 pb-8">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">Welcome to Eqde!</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Let&apos;s set up your financial plan in just a few steps.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Set Your Income</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your monthly income to get started
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <PieChart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Allocate Your Budget</h3>
                      <p className="text-sm text-muted-foreground">
                        Distribute your income across categories you choose
                      </p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleNext} className="w-full" size="lg">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Income Step */}
          {step === 'income' && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">What&apos;s your monthly income?</CardTitle>
                <CardDescription>
                  Enter the total amount you earn each month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="income">Monthly Income (ETB)</Label>
                  <Input
                    id="income"
                    type="number"
                    placeholder="0.00"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="text-2xl h-14 text-center"
                  />
                </div>
                
                {incomeAmount > 0 && (
                  <p className="text-center text-muted-foreground">
                    You entered: <span className="font-semibold text-foreground">{formatCurrency(incomeAmount)}</span>
                  </p>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Allocation Step */}
          {step === 'allocation' && (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Allocate Your Budget</CardTitle>
                    <CardDescription>
                      Choose how to distribute your {formatCurrency(incomeAmount)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <Switch
                      checked={usePercentage}
                      onCheckedChange={setUsePercentage}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Suggested Categories */}
                <div className="space-y-3">
                  <Label>Add Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_CATEGORIES.filter(c => !allocations.some(a => a.category === c.key)).map(cat => (
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
                    {!showCustomInput && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomInput(true)}
                        className="border-dashed"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Custom
                      </Button>
                    )}
                  </div>
                  
                  {/* Custom Category Input */}
                  {showCustomInput && (
                    <div className="flex gap-2 p-3 rounded-xl border border-dashed border-border bg-muted/30">
                      <Input
                        placeholder="Enter category name..."
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomCategory()
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={addCustomCategory}
                        disabled={!customCategoryName.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCustomInput(false)
                          setCustomCategoryName('')
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Added Categories */}
                {allocations.length > 0 && (
                  <div className="space-y-3">
                    <Label>Your Allocations</Label>
                    {allocations.map(alloc => (
                      <div key={alloc.category} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: alloc.color.replace('var(--', 'hsl(var(--').replace(')', '))') }}
                        />
                        <span className="font-medium text-foreground flex-1">{alloc.label}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={alloc.value || ''}
                            onChange={(e) => updateAllocationValue(alloc.category, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground w-8">
                            {usePercentage ? '%' : 'ETB'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeCategory(alloc.category)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {allocations.length > 0 && (
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Allocated:</span>
                      <span className={`font-semibold ${isValidAllocation ? 'text-green-600' : 'text-destructive'}`}>
                        {usePercentage ? `${totalAllocated.toFixed(1)}%` : formatCurrency(totalAllocated)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-medium text-foreground">
                        {usePercentage ? '100%' : formatCurrency(incomeAmount)}
                      </span>
                    </div>
                    {!isValidAllocation && (
                      <p className="text-xs text-destructive">
                        {usePercentage 
                          ? `${(100 - totalAllocated).toFixed(1)}% remaining to allocate`
                          : `${formatCurrency(incomeAmount - totalAllocated)} remaining to allocate`}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1" disabled={!isValidAllocation}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Step */}
          {step === 'confirmation' && (
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Review Your Plan</CardTitle>
                <CardDescription>
                  Confirm your financial setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Income Summary */}
                <div className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Monthly Income</span>
                    <span className="text-xl font-semibold text-foreground">{formatCurrency(incomeAmount)}</span>
                  </div>
                </div>

                {/* Allocations Summary */}
                <div className="space-y-3">
                  <Label>Budget Allocations</Label>
                  {allocations.map(alloc => {
                    const amount = usePercentage 
                      ? (incomeAmount * alloc.value) / 100 
                      : alloc.value
                    const percentage = usePercentage 
                      ? alloc.value 
                      : (alloc.value / incomeAmount) * 100
                    
                    return (
                      <div key={alloc.category} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: alloc.color.replace('var(--', 'hsl(var(--').replace(')', '))') }}
                          />
                          <span className="font-medium text-foreground">{alloc.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{formatCurrency(amount)}</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleComplete} className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Confirm & Start
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
