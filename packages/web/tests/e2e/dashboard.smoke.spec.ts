import { test, expect } from '@playwright/test'
import { establishAuthenticatedSession, mockUser } from './utils/auth'

test.describe('Dashboard experience', () => {
  test('renders key widgets for authenticated user', async ({ page }) => {
    await page.goto('/login')
    await establishAuthenticatedSession(page, 'dashboard-token', mockUser)

    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible()
    await expect(page.getByText('Total Scans', { exact: false })).toBeVisible()
    await expect(page.getByText('Threats Blocked', { exact: false })).toBeVisible()
    await expect(page.getByText('Risk Score', { exact: false })).toBeVisible()
    await expect(page.getByText('Family Members', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: /recent activity/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /risk level/i })).toBeVisible()
  })
})
