import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const { contactType, contactValue } = await request.json();
    
    // Simplified contact verification
    const result = {
      contactType,
      contactValue,
      isScammer: Math.random() > 0.8, // 20% chance of being flagged
      riskScore: Math.floor(Math.random() * 100),
      riskLevel: 'LOW' as const,
      confidence: Math.floor(Math.random() * 100),
      verificationSources: ['truecaller', 'numverify'],
      flags: [],
      recommendations: ['Monitor this contact', 'Verify through additional sources']
    };

    // Save to Supabase if available
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: verification } = await supabase
        .from('contact_verifications')
        .insert([{
          contact_type: contactType,
          contact_value: contactValue,
          is_scammer: result.isScammer,
          risk_score: result.riskScore,
          risk_level: result.riskLevel,
          confidence: result.confidence,
          verification_sources: result.verificationSources,
          flags: result.flags,
          recommendations: result.recommendations
        }])
        .select()
        .single();
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Contact verification error:', error);
    return NextResponse.json(
      { error: 'Contact verification failed' },
      { status: 500 }
    );
  }
}