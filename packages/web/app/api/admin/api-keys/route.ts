import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from '@/lib/supabase-admin';
import { getApiKeysStorage } from '@/lib/api-keys-storage';
import { JsonApiKeyStorage } from '@/lib/json-storage';

const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-2025';

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
        key: 'COINMARKETCAP_API_KEY',
        name: 'CoinMarketCap',
        description: 'Primary cryptocurrency market data and rankings',
        instructions: 'Sign up for FREE at https://pro.coinmarketcap.com/signup and get API key from dashboard. Free tier includes 10,000 calls/month.',
        testEndpoint: 'https://pro-api.coinmarketcap.com/v1/key/info',
        required: true
      },
      {
        key: 'COINGECKO_API_KEY',
        name: 'CoinGecko',
        description: 'Alternative cryptocurrency data source',
        instructions: 'Get API key at https://www.coingecko.com/en/api/pricing (Pro plan required for key)',
        testEndpoint: 'https://api.coingecko.com/api/v3/ping',
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
    category: 'Scammer Detection Databases',
    keys: [
      {
        key: 'SCAMALERT_API_KEY',
        name: 'ScamAlert (Singapore Police)',
        description: 'Singapore Police Force scam database',
        instructions: 'Free public API. Visit https://www.scamalert.sg/api for documentation. No key required for basic access.',
        testEndpoint: 'https://www.scamalert.sg/api/v1/check',
        required: false
      },
      {
        key: 'CYBERCRIME_COMPLAINTS_KEY',
        name: 'IC3 FBI Database',
        description: 'FBI Internet Crime Complaint Center',
        instructions: 'Public data available. Visit https://www.ic3.gov/Home/API for access information.',
        testEndpoint: null,
        required: false
      },
      {
        key: 'APWG_API_KEY',
        name: 'APWG eCrime Exchange',
        description: 'Anti-Phishing Working Group database',
        instructions: 'Academic/research access available. Apply at https://apwg.org/ecx/ for free researcher access.',
        testEndpoint: 'https://api.ecrimex.net/v1/check',
        required: false
      },
      {
        key: 'SCAMWATCH_API_KEY',
        name: 'Scamwatch Australia',
        description: 'Australian Competition & Consumer Commission',
        instructions: 'Free public data. Visit https://www.scamwatch.gov.au/api for documentation.',
        testEndpoint: 'https://api.scamwatch.gov.au/v1/reports',
        required: false
      },
      {
        key: 'ACTION_FRAUD_KEY',
        name: 'Action Fraud UK',
        description: 'UK National Fraud & Cyber Crime Reporting',
        instructions: 'Public data available. See https://www.actionfraud.police.uk/api for access.',
        testEndpoint: null,
        required: false
      },
      {
        key: 'INTERPOL_NOTICES_KEY',
        name: 'INTERPOL Notices API',
        description: 'INTERPOL Red Notices and wanted persons',
        instructions: 'Free public API. No key required. Documentation at https://interpol.api.bund.dev/',
        testEndpoint: 'https://ws-public.interpol.int/notices/v1/red',
        required: false
      },
      {
        key: 'BETTER_BUSINESS_BUREAU',
        name: 'BBB Scam Tracker',
        description: 'Better Business Bureau scam reports',
        instructions: 'Free public data. Visit https://www.bbb.org/scamtracker/api for access.',
        testEndpoint: 'https://api.bbb.org/api/v1/scamtracker',
        required: false
      },
      {
        key: 'PHISHTANK_API_KEY',
        name: 'PhishTank',
        description: 'Community-based phishing verification',
        instructions: 'Free API key at https://www.phishtank.com/api_register.php',
        testEndpoint: 'https://checkurl.phishtank.com/checkurl/',
        required: false
      },
      {
        key: 'URLVOID_API_KEY',
        name: 'URLVoid',
        description: 'Website reputation checker',
        instructions: 'Free tier available. Sign up at https://www.urlvoid.com/api/',
        testEndpoint: 'https://api.urlvoid.com/v1/info',
        required: false
      },
      {
        key: 'ABUSEIPDB_API_KEY',
        name: 'AbuseIPDB',
        description: 'IP address abuse detection',
        instructions: 'Free API key with 1000 checks/day at https://www.abuseipdb.com/api',
        testEndpoint: 'https://api.abuseipdb.com/api/v2/check',
        required: false
      },
      {
        key: 'VIRUSTOTAL_API_KEY',
        name: 'VirusTotal',
        description: 'URL and file reputation analysis',
        instructions: 'Free API key with 500 requests/day at https://www.virustotal.com/gui/join-us',
        testEndpoint: 'https://www.virustotal.com/api/v3/urls',
        required: false
      },
      {
        key: 'SAFEBROWSING_API_KEY',
        name: 'Google Safe Browsing',
        description: 'Google\'s malicious URL database',
        instructions: 'Free API key at https://developers.google.com/safe-browsing/v4/get-started',
        testEndpoint: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
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
    // Use JSON storage as primary
    const jsonStorage = JsonApiKeyStorage.getInstance();
    const allKeys = await jsonStorage.getAllKeys();
    let savedKeys: Record<string, { value: string; isActive: boolean }> = {};
    
    console.log(`Retrieved ${allKeys.length} API keys from JSON storage`);
    console.log('Storage stats:', jsonStorage.getStats());
    
    allKeys.forEach((item: any) => {
      // Mask the key value for security
      const maskedValue = item.key_value ? '••••••' + item.key_value.slice(-4) : '';
      savedKeys[item.key_name] = {
        value: maskedValue,
        isActive: item.is_active
      };
    });
    
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
    
    // Use JSON storage as primary
    const jsonStorage = JsonApiKeyStorage.getInstance();
    const success = await jsonStorage.saveKey(keyName, keyValue);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      );
    }
    
    // Try to also save to Supabase as backup (but don't fail if it doesn't work)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const storage = getApiKeysStorage(supabase);
        await storage.saveKey(keyName, keyValue);
      }
    } catch (e) {
      console.log('Supabase save failed, but JSON storage succeeded');
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