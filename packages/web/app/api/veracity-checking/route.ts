import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { createClient } from '@/lib/supabase/server'
import { checkVeracity } from '@/lib/detection-helpers'
import { fetchVeracityProvider, deriveRiskLevel } from '@/lib/providers'

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
    const { targetType, targetIdentifier } = body

    if (!targetType || !targetIdentifier) {
      return corsResponse({ success: false, error: 'Target type and identifier are required' }, 400)
    }

    // 1. Local heuristic assessment
    const localAssessment = checkVeracity(targetIdentifier, targetType)

    // 2. External provider check (HaveIBeenPwned)
    const providerResult = await fetchVeracityProvider(targetType, targetIdentifier)

    // 3. Combine results
    let finalRiskLevel = localAssessment.riskLevel
    let finalConfidence = localAssessment.overallConfidence
    let finalSummary = localAssessment.summary
    let finalKeyFindings = localAssessment.keyFindings
    let finalRecommendations = localAssessment.recommendations
    let isVerified = localAssessment.isVerified
    let verificationStatus = localAssessment.verificationStatus

    if (providerResult) {
      // If external provider flags it, it overrides local verification
      if (!providerResult.isVerified) {
        isVerified = false
        verificationStatus = providerResult.verificationStatus || 'UNVERIFIED'
      }

      if (providerResult.riskLevel) finalRiskLevel = providerResult.riskLevel
      if (providerResult.overallConfidence) finalConfidence = Math.round((finalConfidence + providerResult.overallConfidence) / 2)
      if (providerResult.summary) finalSummary = providerResult.summary

      if (providerResult.keyFindings && providerResult.keyFindings.length > 0) {
        finalKeyFindings = [...finalKeyFindings, ...providerResult.keyFindings]
      }
      if (providerResult.recommendations && providerResult.recommendations.length > 0) {
        finalRecommendations = providerResult.recommendations
      }
    }

    const result = {
      success: true,
      data: {
        targetType,
        targetIdentifier,
        isVerified,
        verificationStatus,
        overallConfidence: finalConfidence,
        riskLevel: finalRiskLevel,
        summary: finalSummary,
        keyFindings: finalKeyFindings,
        recommendations: finalRecommendations
      }
    }

    return corsResponse(result)

  } catch (error) {
    console.error('Veracity check error:', error)
    return corsResponse({ success: false, error: error instanceof Error ? error.message : String(error) }, 500)
  }
}
