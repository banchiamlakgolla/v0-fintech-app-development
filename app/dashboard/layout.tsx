'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { useAuth } from '@/context/auth-context'
import { FinanceProvider, useFinance } from '@/context/finance-context'
import { Loader2 } from 'lucide-react'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { refreshData, isLoading, hasData } = useFinance()
  const { onboardingComplete, checkOnboardingStatus } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAndRefresh = async () => {
      await refreshData()
      
      // Check if onboarding is complete (has income and allocations)
      const isComplete = await checkOnboardingStatus()
      
      if (!isComplete && !onboardingComplete) {
        router.push('/onboarding')
        return
      }
      
      setChecking(false)
    }
    
    checkAndRefresh()
  }, [refreshData, checkOnboardingStatus, onboardingComplete, router])

  if (checking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // If still no data after checking, redirect to onboarding
  if (!hasData && !onboardingComplete) {
    router.push('/onboarding')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <FinanceProvider>
      <DashboardContent>{children}</DashboardContent>
    </FinanceProvider>
  )
}
