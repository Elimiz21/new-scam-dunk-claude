import { test, expect, Page } from '@playwright/test'
import { establishAuthenticatedSession, mockUser } from './utils/auth'

type DetectionMockKey =
  | 'contactVerification'
  | 'chatAnalysis'
  | 'tradingAnalysis'
  | 'veracityCheck'

type Serializable = Record<string, unknown>

async function ensureMocksContainer(page: Page) {
  await page.evaluate(() => {
    window.__scamDunkMocks = window.__scamDunkMocks || {}
  })
}

async function setDetectionMock(page: Page, key: DetectionMockKey, payload: Serializable) {
  await ensureMocksContainer(page)
  await page.evaluate(
    ([mockKey, data]) => {
      window.__scamDunkMocks![mockKey] = () => data
    },
    [key, payload]
  )
}

async function setDetectionError(page: Page, key: DetectionMockKey, message: string) {
  await ensureMocksContainer(page)
  await page.evaluate(
    ([mockKey, errorMessage]) => {
      window.__scamDunkMocks![mockKey] = () => {
        throw new Error(errorMessage)
      }
    },
    [key, message]
  )
}

async function clearDetectionMocks(page: Page) {
  await page.evaluate(() => {
    if (!window.__scamDunkMocks) return
    for (const mockKey of Object.keys(window.__scamDunkMocks)) {
      delete window.__scamDunkMocks[mockKey as DetectionMockKey]
    }
    if (Object.keys(window.__scamDunkMocks).length === 0) {
      delete window.__scamDunkMocks
    }
  })
}

test.describe.serial('Detection scan flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await establishAuthenticatedSession(page, `scan-token-${Date.now()}`, mockUser)
  })

  test('contact verification surfaces provider insights', async ({ page }) => {
    await page.goto('/scan/contact')

    await setDetectionMock(page, 'contactVerification', {
      riskScore: 82,
      riskLevel: 'HIGH',
      confidence: 92,
      summary: 'Contact verification flagged significant risk indicators.',
      keyFindings: ['Matches known scam reports'],
      flags: ['Reported by multiple victims'],
      recommendations: ['Block this contact immediately'],
      checks: [
        {
          type: 'email',
          value: 'john@example.com',
          result: {
            riskScore: 88,
            riskLevel: 'HIGH',
            confidence: 94,
            summary: 'Email linked to multiple scam databases.',
            keyFindings: ['Hunter.io score below threshold'],
            flags: ['Reported by multiple victims'],
            recommendations: ['Block this contact immediately'],
            metadata: {
              verificationSources: ['Truecaller', 'EmailRep'],
              isScammer: true,
            },
          },
        },
        {
          type: 'phone',
          value: '+14155551234',
          result: {
            riskScore: 76,
            riskLevel: 'HIGH',
            confidence: 88,
            summary: 'Matches known scam number patterns.',
            keyFindings: ['VOIP number detected'],
            flags: ['VOIP/Virtual number detected'],
            recommendations: ['Block this contact immediately'],
            metadata: {
              verificationSources: ['Numverify'],
              isScammer: true,
            },
          },
        },
      ],
      metadata: {
        checkCount: 2,
        highestRiskScore: 88,
      },
    })

    await page.getByPlaceholder('John Doe').fill('John Doe')
    await page.getByPlaceholder('+1 234 567 8900').fill('+14155551234')
    await page.getByPlaceholder('john@example.com').fill('john@example.com')
    await page.getByRole('button', { name: /Start Verification/i }).click()

    await expect(page.getByRole('heading', { name: 'Verification Complete' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('contact-summary')).toContainText(
      'Contact verification flagged significant risk indicators.'
    )
    await expect(page.getByTestId('contact-insight').first()).toContainText('Email: john@example.com')

    await clearDetectionMocks(page)
  })

  test('contact verification surfaces provider errors when lookups fail', async ({ page }) => {
    await page.goto('/scan/contact')

    await setDetectionMock(page, 'contactVerification', {
      riskScore: 0,
      riskLevel: 'LOW',
      confidence: 0,
      summary: 'Unable to verify any contact details. Please try again later.',
      recommendations: [],
      flags: [],
      keyFindings: [],
      checks: [
        {
          type: 'email',
          value: 'error@example.com',
          error: 'Provider offline',
        },
      ],
      metadata: {
        checkCount: 1,
        highestRiskScore: 0,
      },
    })

    await page.getByPlaceholder('john@example.com').fill('error@example.com')
    await page.getByRole('button', { name: /Start Verification/i }).click()

    await expect(page.getByRole('heading', { name: 'Verification Complete' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Unable to verify any contact details', { exact: false })).toBeVisible()
    await expect(page.getByText('Provider offline')).toBeVisible()

    await clearDetectionMocks(page)
  })

  test('chat analysis renders suspicious findings', async ({ page }) => {
    await page.goto('/scan/chat')

    await setDetectionMock(page, 'chatAnalysis', {
      riskScore: 72,
      riskLevel: 'HIGH',
      confidence: 85,
      summary: 'Conversation contains high-pressure investment tactics.',
      platform: 'whatsapp',
      keyFindings: ['Repeated urgent payment requests', 'Promises of guaranteed returns'],
      suspiciousMentions: ['Wire transfer', 'Guaranteed 200% return'],
      recommendations: ['Pause conversation', 'Report to authorities'],
    })

    await page
      .getByPlaceholder(/Paste your chat messages here/i)
      .fill('John: Send money now\nYou: Why?')
    await page.getByRole('button', { name: /Analyze Conversation/i }).click()

    await expect(page.getByRole('heading', { name: 'Analysis Results' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Repeated urgent payment requests')).toBeVisible()
    await expect(page.getByText('Wire transfer')).toBeVisible()

    await clearDetectionMocks(page)
  })

  test('chat analysis shows failure notice when provider errors', async ({ page }) => {
    await page.goto('/scan/chat')

    await setDetectionError(page, 'chatAnalysis', 'Chat provider unavailable')

    await page.getByPlaceholder(/Paste your chat messages here/i).fill('Sample message')
    const consolePromise = page.waitForEvent('console', {
      predicate: (msg) => msg.type() === 'error' && msg.text().toLowerCase().includes('chat analysis failed'),
    })
    await page.getByRole('button', { name: /Analyze Conversation/i }).click()

    await consolePromise
    await expect(page.getByRole('button', { name: /Analyze Conversation/i })).toBeEnabled()

    await clearDetectionMocks(page)
  })

  test('trading analysis summarises high risk signals', async ({ page }) => {
    await page.goto('/scan/trading')

    await setDetectionMock(page, 'tradingAnalysis', {
      symbol: 'AAPL',
      riskScore: 78,
      riskLevel: 'HIGH',
      confidence: 81,
      summary: 'Significant volume spikes with insider trading indicators.',
      keyFindings: ['Unusual after-hours volume', 'Insider transaction cluster detected'],
      recommendations: ['Avoid new positions', 'Monitor regulatory filings'],
    })

    await page.getByLabel('Ticker Symbol').fill('AAPL')
    await page.getByRole('button', { name: /Analyze Trading Patterns/i }).click()

    await expect(page.getByRole('heading', { name: 'Trading Analysis Results' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Symbol analyzed: AAPL')).toBeVisible()
    await expect(page.getByText('Unusual after-hours volume')).toBeVisible()

    await clearDetectionMocks(page)
  })

  test('trading analysis shows failure notice when provider errors', async ({ page }) => {
    await page.goto('/scan/trading')

    await setDetectionError(page, 'tradingAnalysis', 'Market data provider unavailable')

    await page.getByLabel('Ticker Symbol').fill('TSLA')
    const consolePromise = page.waitForEvent('console', {
      predicate: (msg) => msg.type() === 'error' && msg.text().toLowerCase().includes('trading analysis failed'),
    })
    await page.getByRole('button', { name: /Analyze Trading Patterns/i }).click()

    await consolePromise
    await expect(page.getByRole('button', { name: /Analyze Trading Patterns/i })).toBeEnabled()

    await clearDetectionMocks(page)
  })

  test('veracity check confirms verified assets', async ({ page }) => {
    await page.goto('/scan/veracity')

    await setDetectionMock(page, 'veracityCheck', {
      targetType: 'entity',
      targetIdentifier: 'AAPL',
      verificationStatus: 'VERIFIED',
      isVerified: true,
      riskScore: 8,
      riskLevel: 'LOW',
      confidence: 92,
      summary: 'Entity is verified with multiple regulatory filings.',
      keyFindings: ['SEC EDGAR filings up to date', 'No law-enforcement notices'],
      recommendations: ['Maintain regular compliance monitoring'],
    })

    await page.getByLabel('Ticker Symbol').fill('AAPL')
    await page.getByRole('button', { name: /Verify Asset Legitimacy/i }).click()

    await expect(page.getByRole('heading', { name: 'Verification Results' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Status: VERIFIED')).toBeVisible()
    await expect(page.getByText('Confidence score: 92%')).toBeVisible()
    await expect(page.getByText('SEC EDGAR filings up to date')).toBeVisible()

    await clearDetectionMocks(page)
  })

  test('veracity check shows failure notice when provider errors', async ({ page }) => {
    await page.goto('/scan/veracity')

    await setDetectionError(page, 'veracityCheck', 'Regulatory database offline')

    await page.getByLabel('Ticker Symbol').fill('FAKE')
    const consolePromise = page.waitForEvent('console', {
      predicate: (msg) => msg.type() === 'error' && msg.text().toLowerCase().includes('veracity check failed'),
    })
    await page.getByRole('button', { name: /Verify Asset Legitimacy/i }).click()

    await consolePromise
    await expect(page.getByRole('button', { name: /Verify Asset Legitimacy/i })).toBeEnabled()

    await clearDetectionMocks(page)
  })
})
