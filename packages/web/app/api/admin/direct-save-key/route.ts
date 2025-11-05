import { NextRequest, NextResponse } from 'next/server';

function resolveSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      'Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available.'
    );
  }

  return { url, key };
}

export async function POST(request: NextRequest) {
  try {
    const { keyName, keyValue } = await request.json();

    if (!keyName || !keyValue) {
      return NextResponse.json(
        { error: 'Missing keyName or keyValue' },
        { status: 400 }
      );
    }

    const { url, key } = resolveSupabaseConfig();
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };

    const checkResponse = await fetch(
      `${url}/rest/v1/api_keys?key_name=eq.${encodeURIComponent(keyName)}`,
      { headers }
    );

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      return NextResponse.json(
        { error: 'Failed to query api_keys table', details: errorText },
        { status: 500 }
      );
    }

    const existing = await checkResponse.json();
    const isUpdate = Array.isArray(existing) && existing.length > 0;

    const mutationResponse = await fetch(
      isUpdate
        ? `${url}/rest/v1/api_keys?key_name=eq.${encodeURIComponent(keyName)}`
        : `${url}/rest/v1/api_keys`,
      {
        method: isUpdate ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify({
          key_name: keyName,
          key_value: keyValue,
          is_active: true,
          updated_at: new Date().toISOString(),
          ...(isUpdate ? {} : { created_at: new Date().toISOString() })
        })
      }
    );

    if (!mutationResponse.ok) {
      const errorText = await mutationResponse.text();
      return NextResponse.json(
        {
          error: `Failed to ${isUpdate ? 'update' : 'insert'} key`,
          details: errorText
        },
        { status: 500 }
      );
    }

    const payload = await mutationResponse.json();
    return NextResponse.json({
      success: true,
      message: `${isUpdate ? 'Updated' : 'Inserted'} ${keyName} in database`,
      action: isUpdate ? 'updated' : 'inserted',
      data: payload[0]
    });
  } catch (error: any) {
    console.error('Direct save error:', error);
    return NextResponse.json(
      { error: 'Failed to save key', message: error.message },
      { status: 500 }
    );
  }
}
