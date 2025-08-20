import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = 'elimizroch@gmail.com';
const ADMIN_PASSWORD = 'Elim2232';
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-2025';

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
    const { email, password } = await request.json();
    
    // Check admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate admin token
    const token = jwt.sign(
      { 
        email: ADMIN_EMAIL,
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );
    
    // Log admin access
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('admin_logs')
        .insert([{
          action: 'login',
          email: ADMIN_EMAIL,
          timestamp: new Date().toISOString()
        }]);
    }
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.email !== ADMIN_EMAIL || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}