import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import { getSupabaseClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth/server-auth';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/subscriptions - Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const userId = authResult.user.userId;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    // Check if user has used free trial
    const { data: freeTrialUsed } = await supabase
      .from('user_scan_usage')
      .select('id')
      .eq('user_id', userId)
      .eq('scan_type', 'free_trial')
      .single();
    
    // Get user's scan count for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data: scanCount } = await supabase
      .from('user_scan_usage')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('used_at', startOfMonth.toISOString());
    
    // Check scan eligibility
    const { data: eligibility } = await supabase
      .rpc('check_user_scan_eligibility', { p_user_id: userId });
    
    return NextResponse.json({
      success: true,
      subscription: subscription || null,
      freeTrialUsed: !!freeTrialUsed,
      currentMonthScans: scanCount?.length || 0,
      scanEligibility: eligibility?.[0] || {
        can_scan: !freeTrialUsed,
        scan_type: freeTrialUsed ? 'pay_per_scan' : 'free_trial',
        reason: freeTrialUsed ? 'Payment required' : 'Free trial available'
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const userId = authResult.user.userId;

    const { planName, paymentMethodId } = await request.json();
    
    if (!planName) {
      return NextResponse.json(
        { error: 'Plan name required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Handle different plan types
    if (planName === 'free_trial') {
      // Check if user already used free trial
      const { data: existingTrial } = await supabase
        .from('user_scan_usage')
        .select('id')
        .eq('user_id', userId)
        .eq('scan_type', 'free_trial')
        .single();
      
      if (existingTrial) {
        return NextResponse.json(
          { error: 'Free trial already used' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Mark free trial as used
      await supabase
        .from('user_scan_usage')
        .insert({
          user_id: userId,
          scan_type: 'free_trial',
          scan_id: `trial_${Date.now()}`
        });
      
      // Update user record
      await supabase
        .from('users')
        .update({ free_trial_used: true })
        .eq('id', userId);
      
      return NextResponse.json({
        success: true,
        message: 'Free trial activated',
        canScan: true
      }, { headers: corsHeaders });
      
    } else if (planName === 'pay_per_scan') {
      // Process one-time payment (integrate with Stripe)
      // For now, just record the transaction
      const transactionId = `pay_${Date.now()}`;
      
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'one_time',
          amount: plan.price,
          status: 'completed', // In production, this would be 'pending' until Stripe confirms
          description: 'Single scan purchase'
        });
      
      await supabase
        .from('user_scan_usage')
        .insert({
          user_id: userId,
          scan_type: 'pay_per_scan',
          payment_id: transactionId,
          amount_paid: plan.price
        });
      
      return NextResponse.json({
        success: true,
        message: 'Scan purchased successfully',
        canScan: true,
        transactionId
      }, { headers: corsHeaders });
      
    } else {
      // Handle monthly subscriptions
      // Cancel existing subscription if any
      await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled', cancel_at_period_end: true })
        .eq('user_id', userId)
        .eq('status', 'active');
      
      // Create new subscription
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      
      const { data: newSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString()
        })
        .select()
        .single();
      
      if (subError) {
        throw subError;
      }
      
      // Update user record
      await supabase
        .from('users')
        .update({ 
          subscription_id: newSubscription.id,
          subscription_status: 'active'
        })
        .eq('id', userId);
      
      // Record payment transaction
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          subscription_id: newSubscription.id,
          transaction_type: 'subscription',
          amount: plan.price,
          status: 'completed',
          description: `${plan.display_name} subscription`
        });
      
      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
        subscription: newSubscription
      }, { headers: corsHeaders });
    }
    
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/subscriptions - Update subscription (upgrade/downgrade)
export async function PUT(request: NextRequest) {
  try {
    const { userId, newPlanName } = await request.json();
    
    if (!userId || !newPlanName) {
      return NextResponse.json(
        { error: 'User ID and new plan name required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Get the new plan details
    const { data: newPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', newPlanName)
      .single();
    
    if (!newPlan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Update existing subscription
    const { data: updatedSubscription } = await supabase
      .from('user_subscriptions')
      .update({ 
        plan_id: newPlan.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();
    
    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: updatedSubscription
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/subscriptions - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Set subscription to cancel at period end
    const { data: cancelledSubscription } = await supabase
      .from('user_subscriptions')
      .update({ 
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();
    
    // Update user record
    await supabase
      .from('users')
      .update({ subscription_status: 'cancelling' })
      .eq('id', userId);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current period',
      subscription: cancelledSubscription
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500, headers: corsHeaders }
    );
  }
}
