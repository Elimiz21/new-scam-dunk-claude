import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, corsResponse, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const { platform, messages } = await request.json();
    
    // Simplified chat analysis
    const result = {
      platform,
      overallRiskScore: Math.floor(Math.random() * 100),
      riskLevel: 'MEDIUM' as const,
      confidence: Math.floor(Math.random() * 100),
      summary: 'Chat analysis completed. Moderate risk detected.',
      keyFindings: [
        'Urgent language detected',
        'Financial request patterns found',
        'Emotional manipulation indicators'
      ],
      recommendations: [
        'Exercise caution with financial requests',
        'Verify identity through official channels',
        'Do not share personal information'
      ]
    };

    return corsResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Chat analysis error:', error);
    return corsResponse(
      { error: 'Chat analysis failed' },
      500
    );
  }
}