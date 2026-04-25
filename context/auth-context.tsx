'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/lib/types'
import { userApi, incomeApi, allocationApi } from '@/lib/api'

interface AuthContextType extends AuthState {
  onboardingComplete: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (user: User) => void
  completeOnboarding: () => void
  checkOnboardingStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = 'eqde_session'
const ONBOARDING_KEY = 'eqde_onboarding'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY)
        if (sessionData) {
          const { userId } = JSON.parse(sessionData)
          const user = await userApi.getById(userId)
          if (user) {
            // Check onboarding status
            const [hasIncome, hasAllocations] = await Promise.all([
              incomeApi.hasIncome(user.id),
              allocationApi.hasAllocations(user.id),
            ])
            const isOnboardingComplete = hasIncome && hasAllocations
            
            // Also check localStorage flag
            const savedOnboarding = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`)
            setOnboardingComplete(isOnboardingComplete || savedOnboarding === 'true')
            
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
      setState(prev => ({ ...prev, isLoading: false }))
    }
    
    checkSession()
  }, [])

  const login = (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }))
    // New users start with onboarding incomplete
    setOnboardingComplete(false)
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = () => {
    if (state.user) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${state.user.id}`)
    }
    localStorage.removeItem(SESSION_KEY)
    setOnboardingComplete(false)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }))
  }

  const completeOnboarding = () => {
    if (state.user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${state.user.id}`, 'true')
    }
    setOnboardingComplete(true)
  }

  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!state.user) return false
    
    const [hasIncome, hasAllocations] = await Promise.all([
      incomeApi.hasIncome(state.user.id),
      allocationApi.hasAllocations(state.user.id),
    ])
    
    const isComplete = hasIncome && hasAllocations
    if (isComplete) {
      setOnboardingComplete(true)
      localStorage.setItem(`${ONBOARDING_KEY}_${state.user.id}`, 'true')
    }
    return isComplete
  }

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      onboardingComplete,
      login, 
      logout, 
      updateUser,
      completeOnboarding,
      checkOnboardingStatus,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
