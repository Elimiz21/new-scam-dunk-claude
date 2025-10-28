import { test, expect } from '@playwright/test'
import { mockUser, prepareAuthStubs } from './utils/auth'

test.describe('Authentication flows', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await prepareAuthStubs(page, 'test-token', mockUser)

    await page.getByPlaceholder(/enter your email/i).fill(mockUser.email)
    await page.getByPlaceholder(/enter your password/i).fill('Password123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible()
  })

  test('successful registration stores session and redirects', async ({ page }) => {
    await page.goto('/register')
    await prepareAuthStubs(page, 'register-token', mockUser)

    await page.getByPlaceholder(/full name/i).fill(mockUser.name)
    await page.getByPlaceholder(/^enter your email$/i).fill(mockUser.email)
    await page.getByPlaceholder(/create a strong password/i).fill('Password123!')
    await page.getByPlaceholder(/confirm your password/i).fill('Password123!')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /create account/i }).click()

    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: /good morning/i })).toBeVisible()
  })
})
