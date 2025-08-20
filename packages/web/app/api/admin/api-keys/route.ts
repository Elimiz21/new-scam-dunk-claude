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

// API key configurations with instructions
const API_KEY_CONFIGS = [
  {
    category: 'AI & Chat Analysis',
    keys: [
      {
        key: 'OPENAI_API_KEY',
        name: 'OpenAI GPT-4',
        description: 'Powers advanced chat manipulation detection',
        instructions: 'Visit https://platform.openai.com/api-keys to create an API key. You need a paid account with GPT-4 access.',
        testEndpoint: 'https://api.openai.com/v1/models',
        required: true
      },
      {
        key: 'ANTHROPIC_API_KEY',
        name: 'Anthropic Claude',
        description: 'Alternative AI for analysis redundancy',
        instructions: 'Sign up at https://console.anthropic.com/ and navigate to API keys section.',
        testEndpoint: 'https://api.anthropic.com/v1/messages',
        required: false
      },
      {
        key: 'HUGGINGFACE_API_KEY',
        name: 'HuggingFace',
        description: 'Sentiment and emotion analysis',
        instructions: 'Create a free account at https://huggingface.co/settings/tokens and generate an access token.',
        testEndpoint: 'https://api-inference.huggingface.co/models',
        required: false
      }
    ]
  },
  {
    category: 'Contact Verification',
    keys: [
      {
        key: 'TRUECALLER_API_KEY',
        name: 'Truecaller',
        description: 'Phone number spam detection',
        instructions: 'Apply for API access at https://developer.truecaller.com/. Note: Approval may take time.',
        testEndpoint: null,
        required: false
      },
      {
        key: 'HUNTER_IO_API_KEY',
        name: 'Hunter.io',
        description: 'Email verification and discovery',
        instructions: 'Sign up at https://hunter.io/api and get your API key from the dashboard.',
        testEndpoint: 'https://api.hunter.io/v2/account',
        required: false
      },
      {
        key: 'EMAILREP_API_KEY',
        name: 'EmailRep',
        description: 'Email reputation checking',
        instructions: 'Get a free API key at https://emailrep.io/key',
        testEndpoint: 'https://emailrep.io/query',
        required: false
      },
      {
        key: 'NUMVERIFY_API_KEY',
        name: 'Numverify',
        description: 'Phone number validation',
        instructions: 'Sign up for free at https://numverify.com/product and get API key from dashboard.',
        testEndpoint: 'http://apilayer.net/api/validate',
        required: false
      }
    ]
  },
  {
    category: 'Trading & Market Analysis',
    keys: [
      {
        key: 'ALPHA_VANTAGE_API_KEY',
        name: 'Alpha Vantage',
        description: 'Stock market data and technical indicators',
        instructions: 'Get a free API key at https://www.alphavantage.co/support/#api-key',
        testEndpoint: 'https://www.alphavantage.co/query',
        required: true
      },
      {
        key: 'YAHOO_FINANCE_API_KEY',
        name: 'Yahoo Finance',
        description: 'Comprehensive financial data',
        instructions: 'Use RapidAPI at https://rapidapi.com/apidojo/api/yahoo-finance1',
        testEndpoint: null,
        required: false
      },
      {
        key: 'COINGECKO_API_KEY',
        name: 'CoinGecko',
        description: 'Cryptocurrency market data',
        instructions: 'Get API key at https://www.coingecko.com/en/api/pricing (Pro plan required for key)',
        testEndpoint: 'https://api.coingecko.com/api/v3/ping',
        required: true
      },
      {
        key: 'COINMARKETCAP_API_KEY',
        name: 'CoinMarketCap',
        description: 'Crypto rankings and data',
        instructions: 'Sign up at https://pro.coinmarketcap.com/signup and get API key from dashboard.',
        testEndpoint: 'https://pro-api.coinmarketcap.com/v1/key/info',
        required: false
      },
      {
        key: 'NEWS_API_KEY',
        name: 'NewsAPI',
        description: 'Financial news for correlation',
        instructions: 'Get a free API key at https://newsapi.org/register',
        testEndpoint: 'https://newsapi.org/v2/top-headlines',
        required: false
      }
    ]
  },
  {
    category: 'Blockchain & Veracity',
    keys: [
      {
        key: 'ETHERSCAN_API_KEY',
        name: 'Etherscan',
        description: 'Ethereum blockchain explorer',
        instructions: 'Create a free account at https://etherscan.io/apis and generate API key.',
        testEndpoint: 'https://api.etherscan.io/api',
        required: true
      },
      {
        key: 'BSCSCAN_API_KEY',
        name: 'BSCScan',
        description: 'Binance Smart Chain explorer',
        instructions: 'Sign up at https://bscscan.com/apis and get your API key.',
        testEndpoint: 'https://api.bscscan.com/api',
        required: false
      },
      {
        key: 'SEC_EDGAR_API_KEY',
        name: 'SEC EDGAR',
        description: 'SEC filings and company data',
        instructions: 'EDGAR API is free but requires user agent. See https://www.sec.gov/developer',
        testEndpoint: null,
        required: false
      },
      {
        key: 'FINRA_API_KEY',
        name: 'FINRA',
        description: 'Broker and firm verification',
        instructions: 'FINRA data is publicly available. No API key needed for basic queries.',
        testEndpoint: null,
        required: false
      }
    ]
  },
  {
    category: 'Monitoring & Analytics',
    keys: [
      {
        key: 'SENTRY_DSN',
        name: 'Sentry',
        description: 'Error tracking and monitoring',
        instructions: 'Create a project at https://sentry.io/ and copy the DSN from project settings.',
        testEndpoint: null,
        required: false
      },
      {
        key: 'GOOGLE_ANALYTICS_ID',
        name: 'Google Analytics',
        description: 'User behavior analytics',
        instructions: 'Set up GA4 property at https://analytics.google.com/ and get Measurement ID.',
        testEndpoint: null,
        required: false
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const supabase = getSupabaseClient();
    let savedKeys = {};
    
    if (supabase) {
      // Get saved API keys from database
      const { data } = await supabase
        .from('api_keys')
        .select('key_name, key_value, is_active')
        .eq('is_active', true);
      
      if (data) {
        data.forEach(item => {
          // Mask the key value for security
          savedKeys[item.key_name] = {
            value: item.key_value ? '••••••' + item.key_value.slice(-4) : '',
            isActive: item.is_active
          };
        });
      }
    }
    
    // Merge with configuration
    const keysWithStatus = API_KEY_CONFIGS.map(category => ({
      ...category,
      keys: category.keys.map(key => ({
        ...key,
        currentValue: savedKeys[key.key] || { value: '', isActive: false },
        isConfigured: !!savedKeys[key.key]?.value
      }))
    }));
    
    return NextResponse.json({
      success: true,
      apiKeys: keysWithStatus
    });
  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { keyName, keyValue } = await request.json();
    
    if (!keyName || !keyValue) {
      return NextResponse.json(
        { error: 'Key name and value are required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    if (supabase) {
      // Check if key exists
      const { data: existing } = await supabase
        .from('api_keys')
        .select('id')
        .eq('key_name', keyName)
        .single();
      
      if (existing) {
        // Update existing key
        await supabase
          .from('api_keys')
          .update({
            key_value: keyValue,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('key_name', keyName);
      } else {
        // Insert new key
        await supabase
          .from('api_keys')
          .insert([{
            key_name: keyName,
            key_value: keyValue,
            is_active: true,
            created_at: new Date().toISOString()
          }]);
      }
      
      // Log the action
      await supabase
        .from('admin_logs')
        .insert([{
          action: 'api_key_update',
          details: { key_name: keyName },
          email: 'elimizroch@gmail.com',
          timestamp: new Date().toISOString()
        }]);
    }
    
    return NextResponse.json({
      success: true,
      message: `API key ${keyName} saved successfully`
    });
  } catch (error) {
    console.error('API key save error:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { keyName } = await request.json();
    
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('key_name', keyName);
      
      // Log the action
      await supabase
        .from('admin_logs')
        .insert([{
          action: 'api_key_delete',
          details: { key_name: keyName },
          email: 'elimizroch@gmail.com',
          timestamp: new Date().toISOString()
        }]);
    }
    
    return NextResponse.json({
      success: true,
      message: `API key ${keyName} removed`
    });
  } catch (error) {
    console.error('API key delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}