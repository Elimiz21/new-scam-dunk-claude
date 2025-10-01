import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getSupabaseClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth/server-auth';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/check-scan-eligibility - Check if user can perform a scan
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user: authUser } = authResult;

    const { userId: overrideUserId, email } = await request.json();
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      // If no database, allow scan for demo purposes
      return NextResponse.json({
        success: true,
        canScan: true,
        scanType: 'demo',
        message: 'Demo mode - scan allowed',
        requiresPayment: false
      }, { headers: corsHeaders });
    }
    
    // Get or create user
    let user;
    if (overrideUserId || email) {
      const lookupEmail = email ?? authUser.email;
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', lookupEmail)
        .single();
      
      if (!existingUser) {
        // Create new user
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            email: lookupEmail,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        user = newUser;
      } else {
        user = existingUser;
      }
    } else {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.userId)
        .single();
      user = existingUser;
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // Check for active subscription
    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (activeSubscription) {
      // Check if subscription is still valid
      const now = new Date();
      const periodEnd = new Date(activeSubscription.current_period_end);
      
      if (periodEnd > now) {
        // Check if user has reached scan limit (if applicable)
        const plan = activeSubscription.subscription_plans;
        if (plan.max_scans_per_month) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          
          const { count } = await supabase
            .from('user_scan_usage')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('used_at', startOfMonth.toISOString());
          
          if (count && count >= plan.max_scans_per_month) {
            return NextResponse.json({
              success: true,
              canScan: false,
              scanType: 'subscription',
              message: `Monthly scan limit reached (${plan.max_scans_per_month} scans)`,
              requiresPayment: true,
              suggestedAction: 'upgrade'
            }, { headers: corsHeaders });
          }
        }
        
        return NextResponse.json({
          success: true,
          canScan: true,
          scanType: 'subscription',
          message: 'Active subscription - scan allowed',
          requiresPayment: false,
          subscription: {
            plan: plan.display_name,
            expiresAt: activeSubscription.current_period_end
          }
        }, { headers: corsHeaders });
      }
    }
    
    // Check if user has unused free trial
    const { data: freeTrialUsed } = await supabase
      .from('user_scan_usage')
      .select('id')
      .eq('user_id', user.id)
      .eq('scan_type', 'free_trial')
      .single();
    
    if (!freeTrialUsed) {
      return NextResponse.json({
        success: true,
        canScan: true,
        scanType: 'free_trial',
        message: 'Free trial available - 1 scan allowed',
        requiresPayment: false,
        isFirstScan: true
      }, { headers: corsHeaders });
    }
    
    // Check for unused pay-per-scan credits
    const { data: unusedCredits } = await supabase
      .from('user_scan_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('scan_type', 'pay_per_scan')
      .is('scan_id', null)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (unusedCredits && unusedCredits.length > 0) {
      return NextResponse.json({
        success: true,
        canScan: true,
        scanType: 'pay_per_scan',
        message: 'Paid scan credit available',
        requiresPayment: false,
        creditId: unusedCredits[0].id
      }, { headers: corsHeaders });
    }
    
    // No valid subscription or credits
    return NextResponse.json({
      success: true,
      canScan: false,
      scanType: 'none',
      message: 'Payment required to perform scan',
      requiresPayment: true,
      pricing: {
        singleScan: 4.99,
        monthlyPersonal: 9.99,
        monthlyFamily: 19.99,
        monthlyTeams: 49.99
      },
      suggestedAction: 'purchase'
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Scan eligibility check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check scan eligibility',
        canScan: true, // Allow scan in case of error
        scanType: 'error_fallback'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET /api/check-scan-eligibility - Get scan eligibility for current user
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const mockRequest = {
      headers: request.headers,
      json: async () => ({
        userId: authResult.user.userId,
        email: authResult.user.email,
      }),
    } as unknown as NextRequest;

    return POST(mockRequest);
    
  } catch (error) {
    console.error('Scan eligibility GET error:', error);
    return NextResponse.json(
      { error: 'Failed to check scan eligibility' },
      { status: 500, headers: corsHeaders }
    );
  }
}
