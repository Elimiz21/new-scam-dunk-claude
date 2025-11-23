import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { createClient } from '@/lib/supabase/server'
import { analyzeTrading } from '@/lib/detection-helpers'
import { fetchTradingProvider, combineScores, deriveRiskLevel } from '@/lib/providers'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return corsResponse({ success: false, error: 'Unauthorized' }, 401)
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
