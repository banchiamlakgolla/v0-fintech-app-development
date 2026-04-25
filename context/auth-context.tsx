'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/lib/types'
import { userApi } from '@/lib/api'

interface AuthContextType extends AuthState {
  login: (user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_KEY = 'finwise_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY)
        if (sessionData) {
          const { userId } = JSON.parse(sessionData)
          const user = await userApi.getById(userId)
          if (user) {
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
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
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
