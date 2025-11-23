import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { analyzeTrading } from '@/lib/detection-helpers'
import jwt from 'jsonwebtoken'
import { fetchTradingProvider, combineScores, deriveRiskLevel } from '@/lib/providers'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(request: NextRequest) {
  // JWT Verification
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return corsResponse({ success: false, error: 'Unauthorized: Missing or invalid token' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET

  if (!JWT_SECRET) {
    console.error('Server misconfiguration: missing JWT secret')
    return corsResponse({ success: false, error: 'Server error' }, 500)
  }

  try {
    jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('JWT verification failed:', error)
    return corsResponse({ success: false, error: 'Unauthorized: Invalid token' }, 401)
  }

  try {
    const body = await request.json()
    const { symbol } = body

    if (!symbol) {
      return corsResponse({ success: false, error: 'Symbol is required' }, 400)
    }

    // 1. Local heuristic assessment
    const localAssessment = analyzeTrading(symbol)

    // 2. External provider check (AlphaVantage / CoinMarketCap)
    const providerResult = await fetchTradingProvider(symbol)

    // 3. Combine results
    let finalRiskScore = localAssessment.overallRiskScore
    let finalConfidence = localAssessment.confidence
    let finalSummary = localAssessment.summary
    let finalKeyFindings = localAssessment.keyFindings
    let finalRecommendations = localAssessment.recommendations

    if (providerResult) {
      finalRiskScore = combineScores(finalRiskScore, providerResult.riskScore)
      finalConfidence = Math.round((finalConfidence + (providerResult.confidence || 50)) / 2)

      if (providerResult.summary) finalSummary = providerResult.summary
      if (providerResult.keyFindings && providerResult.keyFindings.length > 0) {
        finalKeyFindings = [...finalKeyFindings, ...providerResult.keyFindings]
      }
      if (providerResult.recommendations && providerResult.recommendations.length > 0) {
        finalRecommendations = providerResult.recommendations
      }
    }

    const finalRiskLevel = deriveRiskLevel(finalRiskScore, localAssessment.riskLevel)

    const result = {
      success: true,
      data: {
        symbol,
        overallRiskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        confidence: finalConfidence,
        summary: finalSummary,
        keyFindings: finalKeyFindings,
        recommendations: finalRecommendations
      }
    }

    return corsResponse(result)

  } catch (error) {
    console.error('Trading analysis error:', error)
    return corsResponse({ success: false, error: error instanceof Error ? error.message : String(error) }, 500)
  }
}
