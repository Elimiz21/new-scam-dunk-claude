import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyName, keyValue } = await request.json();
    
    if (!keyName || !keyValue) {
      return NextResponse.json({
        error: 'Missing keyName or keyValue'
      }, { status: 400 });
    }
    
    // Direct POST to Supabase REST API
    const SUPABASE_URL = 'https://gcrkijhkecsfafjbojey.supabase.co';
    const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcmtpamhrZWNzZmFmamJvamV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM5MTkxNSwiZXhwIjoyMDQ4OTY3OTE1fQ.7iQ4mPdAiCDO0SJX4hO-1G_xwi_Ge_xGqC1DJzDcPzc';
    
    // First check if key exists
    const checkResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/api_keys?key_name=eq.${keyName}`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    const existing = await checkResponse.json();
    
    let result;
    
    if (existing && existing.length > 0) {
      // Update existing key
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/api_keys?key_name=eq.${keyName}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            key_value: keyValue,
            is_active: true,
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        return NextResponse.json({
          error: 'Failed to update key',
          details: error
        }, { status: 500 });
      }
      
      result = await updateResponse.json();
      return NextResponse.json({
        success: true,
        message: `Updated ${keyName} in database`,
        action: 'updated',
        data: result[0]
      });
      
    } else {
      // Insert new key
      const insertResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/api_keys`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            key_name: keyName,
            key_value: keyValue,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      );
      
      if (!insertResponse.ok) {
        const error = await insertResponse.text();
        return NextResponse.json({
          error: 'Failed to insert key',
          details: error
        }, { status: 500 });
      }
      
      result = await insertResponse.json();
      return NextResponse.json({
        success: true,
        message: `Inserted ${keyName} in database`,
        action: 'inserted',
        data: result[0]
      });
    }
    
  } catch (error: any) {
    console.error('Direct save error:', error);
    return NextResponse.json({
      error: 'Failed to save key',
      message: error.message
    }, { status: 500 });
  }
}