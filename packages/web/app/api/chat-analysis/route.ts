import { NextRequest, NextResponse } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import jwt from 'jsonwebtoken'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'

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
    const { messages, platform, stream = false } = body

    // If streaming is requested, use the new streaming endpoint
    if (stream) {
      // For streaming, we currently support single text analysis primarily, 
      // so we combine messages or take the last one. 
      // Future improvement: Update Python stream endpoint to handle conversation context.
      const combinedText = messages.map((m: any) => typeof m === 'string' ? m : m.text).join('\n')

      const pythonPayload = {
        text: combinedText,
        include_explanation: true,
        include_evidence: true
      }

      const response = await fetch(`${AI_SERVICE_URL}/api/v1/detection/stream/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pythonPayload),
      })

      if (!response.ok) {
        console.error('AI Service error:', response.status, await response.text())
        return corsResponse({ success: false, error: 'AI Service unavailable' }, 503)
      }

      // Forward the stream directly to the client
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsOptionsResponse().headers, // Add CORS headers
        },
      })
    }

    // Standard non-streaming logic (existing)
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return corsResponse({ success: false, error: 'Messages are required' }, 400)
    }

    // Transform payload for Python Service
    const pythonPayload = {
      messages: messages.map((msg: any) => ({
        text: typeof msg === 'string' ? msg : msg.text,
        sender: 'unknown', // Default since frontend might not send sender
        timestamp: new Date().toISOString()
      })),
      analyze_individual: true,
      analyze_context: true,
      include_explanation: true
    }

    // Call Python Service
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/detection/analyze/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonPayload),
    })

    if (!response.ok) {
      console.error('AI Service error:', response.status, await response.text())
      return corsResponse({ success: false, error: 'AI Service unavailable' }, 503)
    }

    const aiData = await response.json()

    // Map Python response back to frontend format
    const result = {
      success: true,
      data: {
        platform: platform || 'unknown',
        overallRiskScore: aiData.overall_risk.final_score * 100,
        riskLevel: aiData.overall_risk.risk_level,
        confidence: aiData.overall_risk.confidence * 100,
        summary: aiData.overall_risk.summary,
        keyFindings: aiData.overall_risk.key_factors?.map((f: any) => f.explanation) || [],
        recommendations: aiData.overall_risk.recommendations || [],
        suspiciousMentions: [], // Python service might not return this exact field yet
      }
    }

    return corsResponse(result)

  } catch (error) {
    console.error('Chat analysis error:', error)
    return corsResponse({ success: false, error: 'Internal server error' }, 500)
  }
}
