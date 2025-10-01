import { NextRequest } from 'next/server';
import axios from 'axios';
import { corsResponse, corsOptionsResponse } from '@/lib/cors';
import { getApiKeysStorage } from '@/lib/api-keys-storage';
import { getSupabaseClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth/server-auth';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user: authUser } = authResult;

    const { contactType, contactValue } = await request.json();
    
    if (!contactType || !contactValue) {
      return corsResponse({
        success: false,
        error: 'Contact type and value are required'
      }, 400);
    }
    
    // Initialize Supabase and get API keys
    const supabase = getSupabaseClient();
    const storage = getApiKeysStorage(supabase);
    
    if (!supabase) {
      return corsResponse(
        {
          success: false,
          error: 'Database connection failed',
        },
        500
      );
    }
    
    let result = {
      contactType,
      contactValue,
      isScammer: false,
      riskScore: 0,
      riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      confidence: 0,
      verificationSources: [] as string[],
      flags: [] as string[],
      recommendations: [] as string[],
      details: {} as any
    };
    
    // Perform different verifications based on contact type
    if (contactType === 'phone') {
      // Try Numverify API for phone validation
      const numverifyKey = await storage.getKey('NUMVERIFY_API_KEY');
      if (numverifyKey) {
        try {
          const numverifyResponse = await axios.get(
            `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${contactValue}&country_code=&format=1`
          );
          
          if (numverifyResponse.data) {
            const data = numverifyResponse.data;
            result.verificationSources.push('numverify');
            result.details.numverify = {
              valid: data.valid,
              country: data.country_name,
              carrier: data.carrier,
              lineType: data.line_type
            };
            
            // Check if it's a VOIP number (often used in scams)
            if (data.line_type === 'voip' || data.line_type === 'virtual') {
              result.flags.push('VOIP/Virtual number detected');
              result.riskScore += 30;
            }
            
            if (!data.valid) {
              result.flags.push('Invalid phone number');
              result.riskScore += 50;
            }
          }
        } catch (error) {
          console.error('Numverify API error:', error);
        }
      }
      
      // Check against known scammer databases (simulate with patterns)
      const scammerPatterns = [
        /^1900/, // Premium rate numbers
        /^1-900/,
        /^\+234/, // Nigerian country code (common in scams)
        /^\+419/, // Another Nigerian prefix
      ];
      
      if (scammerPatterns.some(pattern => pattern.test(contactValue))) {
        result.flags.push('Matches known scam number patterns');
        result.riskScore += 40;
        result.isScammer = true;
      }
      
    } else if (contactType === 'email') {
      // Try Hunter.io API for email verification
      const hunterKey = await storage.getKey('HUNTER_IO_API_KEY');
      if (hunterKey) {
        try {
          const hunterResponse = await axios.get(
            `https://api.hunter.io/v2/email-verifier?email=${contactValue}&api_key=${hunterKey}`
          );
          
          if (hunterResponse.data?.data) {
            const data = hunterResponse.data.data;
            result.verificationSources.push('hunter.io');
            result.details.hunter = {
              status: data.status,
              score: data.score,
              disposable: data.disposable,
              webmail: data.webmail,
              gibberish: data.gibberish
            };
            
            // Calculate risk based on Hunter.io results
            if (data.status === 'invalid') {
              result.flags.push('Invalid email address');
              result.riskScore += 50;
            }
            if (data.disposable) {
              result.flags.push('Disposable email address');
              result.riskScore += 40;
            }
            if (data.gibberish) {
              result.flags.push('Gibberish email detected');
              result.riskScore += 30;
            }
            if (data.score < 50) {
              result.flags.push('Low deliverability score');
              result.riskScore += 20;
            }
          }
        } catch (error) {
          console.error('Hunter.io API error:', error);
        }
      }
      
      // Try EmailRep API for reputation check
      const emailRepKey = await storage.getKey('EMAILREP_API_KEY');
      if (emailRepKey) {
        try {
          const emailRepResponse = await axios.get(
            `https://emailrep.io/${contactValue}`,
            { headers: { 'Key': emailRepKey } }
          );
          
          if (emailRepResponse.data) {
            const data = emailRepResponse.data;
            result.verificationSources.push('emailrep');
            result.details.emailrep = {
              reputation: data.reputation,
              suspicious: data.suspicious,
              blacklisted: data.details?.blacklisted,
              maliciousActivity: data.details?.malicious_activity,
              credentialsLeaked: data.details?.credentials_leaked,
              dataBreaches: data.details?.data_breach
            };
            
            // Calculate risk based on EmailRep results
            if (data.reputation === 'high') {
              // Good reputation, reduce risk
              result.riskScore = Math.max(0, result.riskScore - 20);
            } else if (data.reputation === 'medium') {
              result.riskScore += 10;
            } else if (data.reputation === 'low') {
              result.flags.push('Low email reputation');
              result.riskScore += 40;
            }
            
            if (data.suspicious) {
              result.flags.push('Suspicious email activity detected');
              result.riskScore += 30;
              result.isScammer = true;
            }
            
            if (data.details?.blacklisted) {
              result.flags.push('Email is blacklisted');
              result.riskScore += 50;
              result.isScammer = true;
            }
            
            if (data.details?.malicious_activity) {
              result.flags.push('Malicious activity detected');
              result.riskScore += 40;
              result.isScammer = true;
            }
          }
        } catch (error) {
          console.error('EmailRep API error:', error);
        }
      }
      
      // Check for common scam email patterns
      const scamEmailPatterns = [
        /@(gmail|yahoo|hotmail|outlook)\.(tk|ml|ga|cf)$/i, // Suspicious TLDs
        /^(prince|lottery|winner|claim|urgent)/i, // Common scam prefixes
        /\d{5,}@/i, // Many numbers before @
      ];
      
      if (scamEmailPatterns.some(pattern => pattern.test(contactValue))) {
        result.flags.push('Matches known scam email patterns');
        result.riskScore += 30;
      }
      
    } else if (contactType === 'name' || contactType === 'username') {
      // Check for common scam name patterns
      const scamNamePatterns = [
        /^(prince|princess|barrister|dr\.|rev\.|general)/i,
        /(lottery|winner|agent|official|bank)/i,
        /microsoft|apple|amazon|google|paypal/i, // Impersonation
      ];
      
      if (scamNamePatterns.some(pattern => pattern.test(contactValue))) {
        result.flags.push('Suspicious name pattern detected');
        result.riskScore += 35;
      }
      
      // Simulate checking against known scammer database
      const knownScammerNames = [
        'David Wilson', 'John Smith FBI', 'Microsoft Support',
        'Amazon Security', 'IRS Agent', 'Windows Defender'
      ];
      
      if (knownScammerNames.some(name => 
        contactValue.toLowerCase().includes(name.toLowerCase())
      )) {
        result.flags.push('Matches known scammer alias');
        result.riskScore += 50;
        result.isScammer = true;
      }
    }
    
    // If no APIs were available, provide basic analysis
    if (result.verificationSources.length === 0) {
      result.verificationSources.push('pattern-analysis');
      result.confidence = 40;
      
      // Basic pattern checking as fallback
      if (!result.flags.length) {
        result.flags.push('Limited verification available');
        result.recommendations.push('Manual verification recommended');
      }
    } else {
      // Calculate confidence based on number of sources
      result.confidence = Math.min(95, 50 + (result.verificationSources.length * 20));
    }
    
    // Cap risk score at 100
    result.riskScore = Math.min(100, result.riskScore);
    
    // Determine risk level based on score
    if (result.riskScore >= 75) {
      result.riskLevel = 'CRITICAL';
    } else if (result.riskScore >= 50) {
      result.riskLevel = 'HIGH';
    } else if (result.riskScore >= 25) {
      result.riskLevel = 'MEDIUM';
    } else {
      result.riskLevel = 'LOW';
    }
    
    // Generate recommendations based on risk level
    if (result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH') {
      result.recommendations.push('Block this contact immediately');
      result.recommendations.push('Do not share any personal information');
      result.recommendations.push('Report to authorities if harassment continues');
    } else if (result.riskLevel === 'MEDIUM') {
      result.recommendations.push('Exercise caution with this contact');
      result.recommendations.push('Verify identity through other means');
      result.recommendations.push('Do not share sensitive information');
    } else {
      result.recommendations.push('Contact appears legitimate');
      result.recommendations.push('Continue with normal caution');
      result.recommendations.push('Monitor for any suspicious behavior');
    }
    
    // Save to Supabase if available
    if (supabase) {
      try {
        await supabase
          .from('contact_verifications')
          .insert([{
            user_id: authUser.userId,
            contact_type: contactType,
            contact_value: contactValue,
            is_scammer: result.isScammer,
            risk_score: result.riskScore,
            risk_level: result.riskLevel,
            confidence: result.confidence,
            verification_sources: result.verificationSources,
            flags: result.flags,
            recommendations: result.recommendations
          }]);
      } catch (error) {
        console.error('Failed to save verification to database:', error);
      }
    }

    return corsResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Contact verification error:', error);
    return corsResponse(
      { error: 'Contact verification failed' },
      500
    );
  }
}
