import { test, expect } from '@playwright/test'

test.describe('Public entry points', () => {
  test('landing page renders key hero content', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /4 Powerful Detection Tests/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Contact Verification/i })).toBeVisible()
  })

  test('login page shows authentication form', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
  })

  test('register page shows onboarding form', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible()
  })
})
