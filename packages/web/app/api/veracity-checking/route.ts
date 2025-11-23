import { NextRequest } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { checkVeracity } from '@/lib/detection-helpers'
import { fetchVeracityProvider } from '@/lib/providers'
import jwt from 'jsonwebtoken' // Added import for jsonwebtoken

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
