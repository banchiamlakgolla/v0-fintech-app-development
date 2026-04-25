'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Header } from '@/components/layout/header'
import { useFinance } from '@/context/finance-context'
import { getCategoryInfo } from '@/lib/types'
import type { Goal } from '@/lib/types'
import { 
  Target, 
  Plus, 
  Wallet, 
  Calendar, 
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function GoalsPage() {
  const { 
    goals, 
    allocations, 
    hasAllocations,
    addGoal, 
    updateGoal, 
    deleteGoal, 
    addFundsToGoal 
  } = useFinance()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isFundDialogOpen, setIsFundDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    category: '',
    deadline: '',
  })
  
  const [fundAmount, setFundAmount] = useState('')

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      category: '',
      deadline: '',
    })
  }

  const handleAddGoal = async () => {
    if (!formData.name || !formData.targetAmount || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await addGoal({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        category: formData.category,
        deadline: formData.deadline || undefined,
      })
      toast.success('Goal created successfully!')
      setIsAddDialogOpen(false)
      resetForm()
    } catch {
      toast.error('Failed to create goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditGoal = async () => {
    if (!selectedGoal || !formData.name || !formData.targetAmount || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      await updateGoal(selectedGoal.id, {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        category: formData.category,
        deadline: formData.deadline || undefined,
      })
      toast.success('Goal updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedGoal(null)
      resetForm()
    } catch {
      toast.error('Failed to update goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGoal = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id)
      toast.success('Goal deleted')
    } catch {
      toast.error('Failed to delete goal')
    }
  }

  const handleAddFunds = async () => {
    if (!selectedGoal || !fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      await addFundsToGoal(selectedGoal.id, parseFloat(fundAmount))
      toast.success(`Added ${formatCurrency(parseFloat(fundAmount))} to ${selectedGoal.name}`)
      setIsFundDialogOpen(false)
      setSelectedGoal(null)
      setFundAmount('')
    } catch {
      toast.error('Failed to add funds')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (goal: Goal) => {
    setSelectedGoal(goal)
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      category: goal.category,
      deadline: goal.deadline || '',
    })
    setIsEditDialogOpen(true)
  }

  const openFundDialog = (goal: Goal) => {
    setSelectedGoal(goal)
    setFundAmount('')
    setIsFundDialogOpen(true)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-success'
    if (progress >= 75) return 'bg-accent'
    if (progress >= 50) return 'bg-primary'
    return 'bg-primary/70'
  }

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    const categoryInfo = getCategoryInfo(goal.category, allocations)
    const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && goal.status === 'active'
    const isNearDeadline = goal.deadline && 
      new Date(goal.deadline) > new Date() && 
      new Date(goal.deadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 &&
      goal.status === 'active'

    return (
      <Card className="border-border/50 hover:border-border transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${categoryInfo.color} 20%, transparent)` }}
              >
                <Target className="w-5 h-5" style={{ color: categoryInfo.color }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{goal.name}</h3>
                <p className="text-xs text-muted-foreground">{categoryInfo.label}</p>
              </div>
            </div>
            
            {goal.status === 'active' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openFundDialog(goal)}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Add Funds
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditDialog(goal)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteGoal(goal)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {goal.status === 'completed' && (
              <div className="flex items-center gap-1.5 text-success bg-success/10 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Completed</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <div 
                className={`absolute inset-0 h-2 rounded-full transition-all ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {formatCurrency(goal.currentAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(goal.targetAmount)}
                </p>
              </div>
              
              {goal.deadline && (
                <div className={`flex items-center gap-1.5 text-xs ${
                  isOverdue ? 'text-destructive' : isNearDeadline ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {isOverdue ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{formatDate(goal.deadline)}</span>
                </div>
              )}
            </div>

            {goal.status === 'active' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => openFundDialog(goal)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Funds
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state if no allocations
  if (!hasAllocations) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          title="Financial Goals"
          description="Set and track your savings goals"
        />
        <div className="flex-1 p-4 lg:p-8">
          <Card className="border-border/50 border-dashed">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No budget allocations set</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  Please set up your budget allocations first before creating goals.
                </p>
                <Button asChild>
                  <a href="/dashboard/budget">Go to Budget</a>
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
        title="Financial Goals"
        description="Set and track your savings goals"
      />
      
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedGoals.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Active Goals</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                  <DialogDescription>
                    Set a financial goal to track your progress
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Goal Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Buy Laptop, Emergency Fund"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetAmount">Target Amount (ETB)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      placeholder="10000"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Linked Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddGoal} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {activeGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3">
                    <Target className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No active goals</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first financial goal to start tracking
                  </p>
                  <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Completed Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update your goal details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Goal Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-targetAmount">Target Amount (ETB)</Label>
              <Input
                id="edit-targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Linked Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline (Optional)</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGoal} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={isFundDialogOpen} onOpenChange={setIsFundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Goal</DialogTitle>
            <DialogDescription>
              {selectedGoal && (
                <>
                  Adding funds to <span className="font-medium">{selectedGoal.name}</span>
                  <br />
                  Current: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (ETB)</Label>
              <Input
                id="fund-amount"
                type="number"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
            </div>
            
            {selectedGoal && fundAmount && parseFloat(fundAmount) > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  After adding: {formatCurrency(selectedGoal.currentAmount + parseFloat(fundAmount))}
                </p>
                {selectedGoal.currentAmount + parseFloat(fundAmount) >= selectedGoal.targetAmount && (
                  <p className="text-success font-medium mt-1">
                    This will complete your goal!
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunds} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
