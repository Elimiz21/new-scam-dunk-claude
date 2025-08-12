'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

interface AuthContextType {
  // We can add shared auth methods here if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, user } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from localStorage/cookies on mount
    initializeAuth()
  }, [initializeAuth])

  const value = {
    // Add shared auth methods here if needed
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}