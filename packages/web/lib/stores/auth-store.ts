import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    twoFactorEnabled: boolean
  }
  subscription: {
    plan: 'free' | 'pro' | 'family'
    status: 'active' | 'canceled' | 'past_due'
    expiresAt?: string
  }
  profile: {
    phone?: string
    dateOfBirth?: string
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  initializeAuth: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Login failed')
          }

          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ loading: true })
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Registration failed')
          }

          const result = await response.json()
          
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        })
        
        // Clear persisted state
        localStorage.removeItem('auth-store')
        
        // Redirect to login
        window.location.href = '/login'
      },

      updateProfile: async (data: Partial<User>) => {
        const { token } = get()
        if (!token) throw new Error('Not authenticated')

        set({ loading: true })
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Profile update failed')
          }

          const updatedUser = await response.json()
          
          set({
            user: updatedUser,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      initializeAuth: () => {
        // This will be called on app load to restore auth state
        // The persist middleware handles the actual restoration
        const { token } = get()
        if (token) {
          set({ isAuthenticated: true })
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)