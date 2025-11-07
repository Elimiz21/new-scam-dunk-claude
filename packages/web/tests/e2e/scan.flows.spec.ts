import { test, expect, Route } from '@playwright/test'
import { establishAuthenticatedSession, mockUser } from './utils/auth'

const CONTACT_ROUTE = '**/contact-verification'
const CHAT_ROUTE = '**/chat-analysis'
const TRADING_ROUTE = '**/trading-analysis'
const VERACITY_ROUTE = '**/veracity-checking'

test.describe.serial('Detection scan flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await establishAuthenticatedSession(page, `scan-token-${Date.now()}`, mockUser)
  })

  test('contact verification surfaces provider insights', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            riskScore: 82,
            riskLevel: 'HIGH',
            summary: 'High risk indicators detected for this contact.',
            keyFindings: ['Matches known scam reports'],
            isScammer: true,
            verificationSources: ['Truecaller', 'EmailRep'],
            checks: [
              {
                type: 'email',
                value: 'john@example.com',
                result: {
                  riskScore: 88,
                  riskLevel: 'HIGH',
                  summary: 'Email linked to multiple scam databases.',
                  flags: ['Reported by multiple victims'],
                  recommendations: ['Block this contact immediately'],
                  verificationSources: ['Truecaller', 'EmailRep'],
                  isScammer: true,
                  metadata: {
                    verificationSources: ['Truecaller', 'EmailRep'],
                    isScammer: true,
                  },
                },
              },
            ],
          },
        }),
      })
    }

    await page.route(CONTACT_ROUTE, handler)
    try {
      await page.goto('/scan/contact')
      await page.getByPlaceholder('john@example.com').fill('john@example.com')
      await page.getByRole('button', { name: /Start Verification/i }).click()

      await expect(
        page.getByRole('heading', { name: 'Verification Complete' })
      ).toBeVisible({ timeout: 20000 })
      await expect(
        page.getByText('Contact verification flagged significant risk indicators.', { exact: false })
      ).toBeVisible()
      await expect(page.getByText('Email: john@example.com')).toBeVisible()
    } finally {
      await page.unroute(CONTACT_ROUTE, handler)
    }
  })

  test('contact verification surfaces provider errors when lookups fail', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Provider offline' }),
      })
    }

    await page.route(CONTACT_ROUTE, handler)
    try {
      await page.goto('/scan/contact')
      await page.getByPlaceholder('john@example.com').fill('error@example.com')
      await page.getByRole('button', { name: /Start Verification/i }).click()

      await expect(
        page.getByRole('heading', { name: 'Verification Complete' })
      ).toBeVisible({ timeout: 20000 })
      await expect(page.getByText('Unable to verify any contact details', { exact: false })).toBeVisible()
      await expect(page.getByText('Provider offline')).toBeVisible()
    } finally {
      await page.unroute(CONTACT_ROUTE, handler)
    }
  })

  test('chat analysis renders suspicious findings', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overallRiskScore: 72,
            riskLevel: 'HIGH',
            summary: 'Conversation contains high-pressure investment tactics.',
            platform: 'whatsapp',
            keyFindings: ['Repeated urgent payment requests', 'Promises of guaranteed returns'],
            suspiciousMentions: ['Wire transfer', 'Guaranteed 200% return'],
            recommendations: ['Pause conversation', 'Report to authorities'],
          },
        }),
      })
    }

    await page.route(CHAT_ROUTE, handler)
    try {
      await page.goto('/scan/chat')
      await page
        .getByPlaceholder(/Paste your chat messages here/i)
        .fill('John: Send money now\nYou: Why?')
      await page.getByRole('button', { name: /Analyze Conversation/i }).click()

      await expect(
        page.getByRole('heading', { name: 'Analysis Results' })
      ).toBeVisible({ timeout: 20000 })
      await expect(page.getByText('Repeated urgent payment requests')).toBeVisible()
      await expect(page.getByText('Wire transfer')).toBeVisible()
    } finally {
      await page.unroute(CHAT_ROUTE, handler)
    }
  })

  test('chat analysis shows failure notice when provider errors', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Chat provider unavailable' }),
      })
    }

    await page.route(CHAT_ROUTE, handler)
    try {
      await page.goto('/scan/chat')
      await page.getByPlaceholder(/Paste your chat messages here/i).fill('Sample message')
      const consolePromise = page.waitForEvent('console', {
        predicate: (msg) =>
          msg.type() === 'error' && msg.text().toLowerCase().includes('chat analysis failed'),
      })
      await page.getByRole('button', { name: /Analyze Conversation/i }).click()

      await consolePromise
      await expect(page.getByRole('button', { name: /Analyze Conversation/i })).toBeEnabled()
    } finally {
      await page.unroute(CHAT_ROUTE, handler)
    }
  })

  test('trading analysis summarises high risk signals', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            symbol: 'AAPL',
            overallRiskScore: 78,
            riskLevel: 'HIGH',
            summary: 'Significant volume spikes with insider trading indicators.',
            keyFindings: ['Unusual after-hours volume', 'Insider transaction cluster detected'],
            recommendations: ['Avoid new positions', 'Monitor regulatory filings'],
          },
        }),
      })
    }

    await page.route(TRADING_ROUTE, handler)
    try {
      await page.goto('/scan/trading')
      await page.getByLabel('Ticker Symbol').fill('AAPL')
      await page.getByRole('button', { name: /Analyze Trading Patterns/i }).click()

      await expect(
        page.getByRole('heading', { name: 'Trading Analysis Results' })
      ).toBeVisible({ timeout: 20000 })
      await expect(page.getByText('Symbol analyzed: AAPL')).toBeVisible()
      await expect(page.getByText('Unusual after-hours volume')).toBeVisible()
    } finally {
      await page.unroute(TRADING_ROUTE, handler)
    }
  })

  test('trading analysis shows failure notice when provider errors', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Market data provider unavailable' }),
      })
    }

    await page.route(TRADING_ROUTE, handler)
    try {
      await page.goto('/scan/trading')
      await page.getByLabel('Ticker Symbol').fill('TSLA')
      const consolePromise = page.waitForEvent('console', {
        predicate: (msg) =>
          msg.type() === 'error' && msg.text().toLowerCase().includes('trading analysis failed'),
      })
      await page.getByRole('button', { name: /Analyze Trading Patterns/i }).click()

      await consolePromise
      await expect(page.getByRole('button', { name: /Analyze Trading Patterns/i })).toBeEnabled()
    } finally {
      await page.unroute(TRADING_ROUTE, handler)
    }
  })

  test('veracity check confirms verified assets', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            targetType: 'entity',
            targetIdentifier: 'AAPL',
            verificationStatus: 'VERIFIED',
            isVerified: true,
            overallConfidence: 92,
            riskLevel: 'LOW',
            summary: 'Entity is verified with multiple regulatory filings.',
            keyFindings: ['SEC EDGAR filings up to date', 'No law-enforcement notices'],
            recommendations: ['Maintain regular compliance monitoring'],
          },
        }),
      })
    }

    await page.route(VERACITY_ROUTE, handler)
    try {
      await page.goto('/scan/veracity')
      await page.getByLabel('Ticker Symbol').fill('AAPL')
      await page.getByRole('button', { name: /Verify Asset Legitimacy/i }).click()

      await expect(
        page.getByRole('heading', { name: 'Verification Results' })
      ).toBeVisible({ timeout: 20000 })
      await expect(page.getByText('Status: VERIFIED')).toBeVisible()
      await expect(page.getByText('Confidence score: 92%')).toBeVisible()
      await expect(page.getByText('SEC EDGAR filings up to date')).toBeVisible()
    } finally {
      await page.unroute(VERACITY_ROUTE, handler)
    }
  })

  test('veracity check shows failure notice when provider errors', async ({ page }) => {
    const handler = async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Regulatory database offline' }),
      })
    }

    await page.route(VERACITY_ROUTE, handler)
    try {
      await page.goto('/scan/veracity')
      await page.getByLabel('Ticker Symbol').fill('FAKE')
      const consolePromise = page.waitForEvent('console', {
        predicate: (msg) =>
          msg.type() === 'error' && msg.text().toLowerCase().includes('veracity check failed'),
      })
      await page.getByRole('button', { name: /Verify Asset Legitimacy/i }).click()

      await consolePromise
      await expect(page.getByRole('button', { name: /Verify Asset Legitimacy/i })).toBeEnabled()
    } finally {
      await page.unroute(VERACITY_ROUTE, handler)
    }
  })
})
