import { test, expect } from '@playwright/test';

const BASE_URL = 'https://scam-dunk-production.vercel.app';

test.describe('Scam Dunk Production Live Tests', () => {
  
  test('Homepage loads and displays 4 detection pillars', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Scam Dunk/i);
    await expect(page.getByText('Contact Verification')).toBeVisible();
    await expect(page.getByText('Chat Analysis')).toBeVisible();
    await expect(page.getByText('Trading Activity')).toBeVisible();
    await expect(page.getByText('Veracity Check')).toBeVisible();
  });

  test('Login page accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('API Health Check', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
  });

});

