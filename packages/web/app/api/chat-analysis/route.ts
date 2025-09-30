import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, corsResponse, corsOptionsResponse } from '@/lib/cors';
import { createClient } from '@supabase/supabase-js';
import { getApiKeysStorage } from '@/lib/api-keys-storage';
import OpenAI from 'openai';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const { platform, messages } = await request.json();
    
    if (!messages || messages.length === 0) {
      return corsResponse({
        success: false,
        error: 'No messages provided for analysis'
      }, 400);
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get API key from storage
    const storage = getApiKeysStorage(supabase);
    const openaiApiKey = await storage.getKey('OPENAI_API_KEY');
    
    if (!openaiApiKey || openaiApiKey === 'demo-key') {
      console.warn('OpenAI API key not configured, using simplified analysis');
      return corsResponse({
        success: true,
        data: performSimplifiedAnalysis(messages, platform)
      });
    }
    
    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Prepare conversation for analysis
    const conversationText = messages.map((m: any) =>
      `[${m.timestamp || new Date().toISOString()}] ${m.sender || 'Unknown'}: ${m.text}`
    ).join('\n');
    
    // Perform AI analysis
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fraud detection analyst specializing in identifying scams, fraud, and suspicious communications. Analyze the provided conversation and provide detailed insights.'
          },
          {
            role: 'user',
            content: `
Analyze the following conversation for potential scams, fraud, or suspicious activity:

${conversationText}

Please provide:
1. A risk score from 0-100 (where 100 is highest risk)
2. A risk level (LOW, MEDIUM, HIGH, or CRITICAL)
3. A concise summary of the conversation
4. Key findings related to scam/fraud indicators (list 3-5 items)
5. Recommendations for the user (list 3-5 items)

Focus on identifying:
- Social engineering tactics
- Urgency manipulation
- Requests for money or personal information
- Impersonation attempts
- Phishing or malware distribution
- Investment scams
- Romance scams
- Technical support scams

Format your response as JSON with the following structure:
{
  "riskScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "string",
  "keyFindings": ["finding1", "finding2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      
      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
      
      return corsResponse({
        success: true,
        data: {
          platform,
          overallRiskScore: analysisResult.riskScore || 50,
          riskLevel: analysisResult.riskLevel || 'MEDIUM',
          confidence: Math.min(100, Math.max(60, 80 + (messages.length * 2))),
          summary: analysisResult.summary || 'Analysis completed',
          keyFindings: analysisResult.keyFindings || [],
          recommendations: analysisResult.recommendations || [],
          tokensUsed: response.usage?.total_tokens || 0
        }
      });
      
    } catch (openAiError) {
      console.error('OpenAI API error:', openAiError);
      return corsResponse({
        success: true,
        data: performSimplifiedAnalysis(messages, platform)
      });
    }
    
  } catch (error) {
    console.error('Chat analysis error:', error);
    return corsResponse(
      { error: 'Chat analysis failed' },
      500
    );
  }
}

function performSimplifiedAnalysis(messages: any[], platform: string) {
  // Keyword-based analysis when OpenAI is not available
  const riskKeywords = {
    high: ['send money', 'wire transfer', 'bitcoin', 'crypto', 'urgent', 'immediately', 'bank account', 'credit card', 'ssn', 'social security'],
    medium: ['investment', 'opportunity', 'guaranteed', 'profit', 'winner', 'selected', 'click here', 'download', 'verify'],
    low: ['hello', 'thanks', 'please', 'help', 'question', 'information']
  };
  
  const combinedText = messages.map(m => m.text || '').join(' ').toLowerCase();
  
  let riskScore = 20;
  let riskLevel = 'LOW';
  const findings = [];
  
  // Check for high risk keywords
  const highRiskFound = riskKeywords.high.filter(keyword => combinedText.includes(keyword));
  if (highRiskFound.length > 0) {
    riskScore += highRiskFound.length * 25;
    riskLevel = highRiskFound.length > 2 ? 'HIGH' : 'MEDIUM';
    findings.push(`Detected high-risk keywords: ${highRiskFound.slice(0, 3).join(', ')}`);
  }
  
  // Check for medium risk keywords
  const mediumRiskFound = riskKeywords.medium.filter(keyword => combinedText.includes(keyword));
  if (mediumRiskFound.length > 0) {
    riskScore += mediumRiskFound.length * 10;
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    findings.push(`Detected suspicious patterns: ${mediumRiskFound.slice(0, 3).join(', ')}`);
  }
  
  // Check for urgency patterns
  if (/\b(urgent|immediately|asap|right now|act fast)\b/gi.test(combinedText)) {
    findings.push('Urgency manipulation detected');
    riskScore += 15;
  }
  
  // Check for money requests
  if (/\$[\d,]+|\b\d+\s*(dollars?|usd|euros?|pounds?)\b/gi.test(combinedText)) {
    findings.push('Financial amounts mentioned');
    riskScore += 10;
  }
  
  // Cap score at 100
  riskScore = Math.min(100, riskScore);
  
  // Adjust risk level based on final score
  if (riskScore >= 75) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 40) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  return {
    platform,
    overallRiskScore: riskScore,
    riskLevel,
    confidence: 60,
    summary: `Keyword-based analysis of ${messages.length} messages detected ${riskLevel.toLowerCase()} risk indicators.`,
    keyFindings: findings.length > 0 ? findings : ['No significant risk indicators detected'],
    recommendations: riskLevel === 'LOW' 
      ? ['Continue monitoring conversations', 'Stay vigilant for unusual requests']
      : riskLevel === 'MEDIUM'
      ? ['Be cautious with any financial requests', 'Verify sender identity independently', 'Do not share personal information']
      : ['Do not engage further', 'Block and report the sender', 'Do not send money or share personal information', 'Report to authorities if threatened']
  };
}