import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { createClient } from '@/lib/supabase/server'
import { assessContact } from '@/lib/detection-helpers'
import { fetchContactProvider, combineScores, mergeFlags, deriveRiskLevel } from '@/lib/providers'

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
    const { contactType, contactValue } = body

    if (!contactType || !contactValue) {
      return corsResponse({ success: false, error: 'Contact type and value are required' }, 400)
    }

    // 1. Local heuristic assessment
    const localAssessment = assessContact(contactType, contactValue)

    // 2. External provider check (EmailRep / Numverify)
    const providerResult = await fetchContactProvider(contactType, contactValue)

    // 3. Combine results
    let finalRiskScore = localAssessment.riskScore
    let finalConfidence = localAssessment.confidence
    let finalFlags = localAssessment.flags
    let finalRecommendations = localAssessment.recommendations

    if (providerResult) {
      finalRiskScore = combineScores(finalRiskScore, providerResult.riskScore)
      finalConfidence = Math.round((finalConfidence + (providerResult.confidence || 50)) / 2)
      finalFlags = mergeFlags(finalFlags, providerResult.flags)
      if (providerResult.recommendations && providerResult.recommendations.length > 0) {
        finalRecommendations = providerResult.recommendations
      }
    }

    const finalRiskLevel = deriveRiskLevel(finalRiskScore, localAssessment.riskLevel)

    const result = {
      success: true,
      data: {
        contactType,
        contactValue,
        riskScore: finalRiskScore,
        riskLevel: finalRiskLevel,
        confidence: finalConfidence,
        flags: finalFlags,
        recommendations: finalRecommendations,
        details: localAssessment.details
      }
    }

    return corsResponse(result)

  } catch (error) {
    console.error('Contact verification error:', error)
    return corsResponse({ success: false, error: 'Internal server error' }, 500)
  }
}
