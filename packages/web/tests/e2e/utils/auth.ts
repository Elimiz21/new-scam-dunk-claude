import { Page } from '@playwright/test'

export const mockUser = {
  id: 'test-user-id',
  email: 'user@example.com',
  name: 'Test User',
  role: 'user',
  preferences: {
    theme: 'light' as const,
    notifications: true,
    twoFactorEnabled: false,
  },
  subscription: {
    plan: 'free' as const,
    status: 'active' as const,
    expiresAt: undefined,
  },
  profile: {},
}

export async function prepareAuthStubs(
  page: Page,
  token: string,
  user: typeof mockUser = mockUser
) {
  await page.evaluate(([sessionToken, sessionUser]: [string, typeof mockUser]) => {
    const authStore = (window as any).__scamDunkAuthStore
    if (!authStore) {
      throw new Error('Auth store not found on window')
    }

    const setAuthenticatedState = () => {
      authStore.setState({
        user: sessionUser,
        token: sessionToken,
        isAuthenticated: true,
        loading: false,
      })
      localStorage.setItem('auth_token', sessionToken)
    }

    const loginStub = async (_email: string, _password: string) => {
      setAuthenticatedState()
    }

    const registerStub = async (_data: unknown) => {
      setAuthenticatedState()
    }

    authStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      login: loginStub,
      register: registerStub,
    })
  }, [token, user] as [string, typeof mockUser])
}

export async function establishAuthenticatedSession(
  page: Page,
  token: string,
  user: typeof mockUser = mockUser
) {
  await page.evaluate(([sessionToken, sessionUser]: [string, typeof mockUser]) => {
    const authStore = (window as any).__scamDunkAuthStore
    if (!authStore) {
      throw new Error('Auth store not found on window')
    }

    authStore.setState({
      user: sessionUser,
      token: sessionToken,
      isAuthenticated: true,
      loading: false,
    })
    localStorage.setItem('auth_token', sessionToken)
  }, [token, user] as [string, typeof mockUser])
}
