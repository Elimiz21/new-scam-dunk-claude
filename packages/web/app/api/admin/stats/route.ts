import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-2025';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.email === 'elimizroch@gmail.com' && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const supabase = getSupabaseClient();
    
    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let stats: {
      totalScans: number;
      scansToday: number;
      scansThisWeek: number;
      scansThisMonth: number;
      totalUsers: number;
      activeUsers: number;
      apiUsage: {
        contactVerification: number;
        chatAnalysis: number;
        tradingAnalysis: number;
        veracityChecking: number;
      };
      riskDistribution: {
        low: number;
        medium: number;
        high: number;
        critical: number;
      };
      recentScans: any[];
      scansByDay: any[];
      topScamTypes: any[];
    } = {
      totalScans: 0,
      scansToday: 0,
      scansThisWeek: 0,
      scansThisMonth: 0,
      totalUsers: 0,
      activeUsers: 0,
      apiUsage: {
        contactVerification: 0,
        chatAnalysis: 0,
        tradingAnalysis: 0,
        veracityChecking: 0
      },
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      recentScans: [],
      scansByDay: [],
      topScamTypes: []
    };
    
    if (supabase) {
      // Get total scans
      const { count: totalScans } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true });
      stats.totalScans = totalScans || 0;
      
      // Get scans by time period
      const { count: scansToday } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      stats.scansToday = scansToday || 0;
      
      const { count: scansThisWeek } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());
      stats.scansThisWeek = scansThisWeek || 0;
      
      const { count: scansThisMonth } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());
      stats.scansThisMonth = scansThisMonth || 0;
      
      // Get user stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      stats.totalUsers = totalUsers || 0;
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', weekAgo.toISOString());
      stats.activeUsers = activeUsers || 0;
      
      // Get recent scans
      const { data: recentScans } = await supabase
        .from('scans')
        .select('id, scan_type, risk_score, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      stats.recentScans = recentScans || [];
      
      // Get API usage by type
      const { data: contactScans } = await supabase
        .from('contact_verifications')
        .select('id', { count: 'exact', head: true });
      stats.apiUsage.contactVerification = contactScans?.length || 0;
      
      const { data: chatScans } = await supabase
        .from('chat_analyses')
        .select('id', { count: 'exact', head: true });
      stats.apiUsage.chatAnalysis = chatScans?.length || 0;
      
      const { data: tradingScans } = await supabase
        .from('trading_analyses')
        .select('id', { count: 'exact', head: true });
      stats.apiUsage.tradingAnalysis = tradingScans?.length || 0;
      
      const { data: veracityScans } = await supabase
        .from('veracity_checks')
        .select('id', { count: 'exact', head: true });
      stats.apiUsage.veracityChecking = veracityScans?.length || 0;
    } else {
      // Mock data for development
      stats = {
        totalScans: 1547,
        scansToday: 42,
        scansThisWeek: 287,
        scansThisMonth: 1123,
        totalUsers: 324,
        activeUsers: 156,
        apiUsage: {
          contactVerification: 423,
          chatAnalysis: 356,
          tradingAnalysis: 289,
          veracityChecking: 479
        },
        riskDistribution: {
          low: 612,
          medium: 543,
          high: 287,
          critical: 105
        },
        recentScans: [
          { id: 1, scan_type: 'contact', risk_score: 85, created_at: new Date().toISOString() },
          { id: 2, scan_type: 'chat', risk_score: 45, created_at: new Date().toISOString() },
          { id: 3, scan_type: 'trading', risk_score: 92, created_at: new Date().toISOString() }
        ],
        scansByDay: [
          { date: '2025-01-14', count: 35 },
          { date: '2025-01-15', count: 42 },
          { date: '2025-01-16', count: 38 },
          { date: '2025-01-17', count: 51 },
          { date: '2025-01-18', count: 47 },
          { date: '2025-01-19', count: 32 },
          { date: '2025-01-20', count: 42 }
        ],
        topScamTypes: [
          { type: 'Pig Butchering', count: 234 },
          { type: 'Romance Scam', count: 189 },
          { type: 'Investment Fraud', count: 156 },
          { type: 'Tech Support', count: 112 },
          { type: 'Crypto Pump', count: 98 }
        ]
      };
    }
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}