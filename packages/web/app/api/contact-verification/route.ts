import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { assessContact } from '@/lib/detection-helpers'
import { fetchContactProvider, combineScores, mergeFlags, deriveRiskLevel } from '@/lib/providers'
import jwt from 'jsonwebtoken'

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
    return corsResponse({ success: false, error: error instanceof Error ? error.message : String(error) }, 500)
  }
}
