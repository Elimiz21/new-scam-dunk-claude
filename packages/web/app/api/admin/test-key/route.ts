import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';

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

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { keyName, keyValue, testEndpoint } = await request.json();
    
    if (!keyName || !keyValue) {
      return NextResponse.json(
        { error: 'Key name and value are required' },
        { status: 400 }
      );
    }
    
    let testResult = {
      success: false,
      message: '',
      details: {}
    };
    
    // Test different API keys
    switch (keyName) {
      case 'OPENAI_API_KEY':
        try {
          const response = await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${keyValue}` }
          });
          testResult.success = response.status === 200;
          testResult.message = 'OpenAI API key is valid';
          testResult.details = { models: response.data.data?.length || 0 };
        } catch (error: any) {
          testResult.message = `OpenAI API error: ${error.response?.data?.error?.message || error.message}`;
        }
        break;
        
      case 'ANTHROPIC_API_KEY':
        try {
          const response = await axios.post('https://api.anthropic.com/v1/messages', 
            {
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            },
            {
              headers: { 
                'x-api-key': keyValue,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              }
            }
          );
          testResult.success = response.status === 200;
          testResult.message = 'Anthropic API key is valid';
        } catch (error: any) {
          testResult.message = `Anthropic API error: ${error.response?.data?.error?.message || error.message}`;
        }
        break;
        
      case 'HUGGINGFACE_API_KEY':
        try {
          const response = await axios.post(
            'https://api-inference.huggingface.co/models/bert-base-uncased',
            { inputs: 'test' },
            { headers: { 'Authorization': `Bearer ${keyValue}` } }
          );
          testResult.success = response.status === 200;
          testResult.message = 'HuggingFace API key is valid';
        } catch (error: any) {
          testResult.message = `HuggingFace API error: ${error.response?.data?.error || error.message}`;
        }
        break;
        
      case 'HUNTER_IO_API_KEY':
        try {
          const response = await axios.get(`https://api.hunter.io/v2/account?api_key=${keyValue}`);
          testResult.success = response.status === 200;
          testResult.message = 'Hunter.io API key is valid';
          testResult.details = { 
            email: response.data?.data?.email,
            requests_left: response.data?.data?.requests?.searches?.available 
          };
        } catch (error: any) {
          testResult.message = `Hunter.io API error: ${error.response?.data?.errors?.[0]?.details || error.message}`;
        }
        break;
        
      case 'EMAILREP_API_KEY':
        try {
          const response = await axios.get('https://emailrep.io/test@example.com', {
            headers: { 'Key': keyValue }
          });
          testResult.success = response.status === 200;
          testResult.message = 'EmailRep API key is valid';
        } catch (error: any) {
          testResult.message = `EmailRep API error: ${error.response?.data?.reason || error.message}`;
        }
        break;
        
      case 'NUMVERIFY_API_KEY':
        try {
          const response = await axios.get(
            `http://apilayer.net/api/validate?access_key=${keyValue}&number=14158586273`
          );
          testResult.success = response.data?.valid !== undefined;
          testResult.message = 'Numverify API key is valid';
        } catch (error: any) {
          testResult.message = `Numverify API error: ${error.response?.data?.error?.info || error.message}`;
        }
        break;
        
      case 'ALPHA_VANTAGE_API_KEY':
        try {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MSFT&apikey=${keyValue}`
          );
          testResult.success = !response.data['Error Message'] && !response.data['Note'];
          testResult.message = response.data['Note'] ? 'API limit reached' : 'Alpha Vantage API key is valid';
        } catch (error: any) {
          testResult.message = `Alpha Vantage API error: ${error.message}`;
        }
        break;
        
      case 'COINGECKO_API_KEY':
        try {
          const response = await axios.get('https://api.coingecko.com/api/v3/ping', {
            headers: keyValue ? { 'x-cg-pro-api-key': keyValue } : {}
          });
          testResult.success = response.data?.gecko_says === '(V3) To the Moon!';
          testResult.message = 'CoinGecko API is accessible';
        } catch (error: any) {
          testResult.message = `CoinGecko API error: ${error.message}`;
        }
        break;
        
      case 'COINMARKETCAP_API_KEY':
        try {
          const response = await axios.get('https://pro-api.coinmarketcap.com/v1/key/info', {
            headers: { 'X-CMC_PRO_API_KEY': keyValue }
          });
          testResult.success = response.status === 200;
          testResult.message = 'CoinMarketCap API key is valid';
          testResult.details = { 
            plan: response.data?.data?.plan?.credit_limit_monthly 
          };
        } catch (error: any) {
          testResult.message = `CoinMarketCap API error: ${error.response?.data?.status?.error_message || error.message}`;
        }
        break;
        
      case 'NEWS_API_KEY':
        try {
          const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=us&apiKey=${keyValue}`
          );
          testResult.success = response.data?.status === 'ok';
          testResult.message = 'NewsAPI key is valid';
        } catch (error: any) {
          testResult.message = `NewsAPI error: ${error.response?.data?.message || error.message}`;
        }
        break;
        
      case 'ETHERSCAN_API_KEY':
        try {
          const response = await axios.get(
            `https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${keyValue}`
          );
          testResult.success = response.data?.status === '1';
          testResult.message = 'Etherscan API key is valid';
        } catch (error: any) {
          testResult.message = `Etherscan API error: ${error.response?.data?.result || error.message}`;
        }
        break;
        
      case 'BSCSCAN_API_KEY':
        try {
          const response = await axios.get(
            `https://api.bscscan.com/api?module=stats&action=bnbsupply&apikey=${keyValue}`
          );
          testResult.success = response.data?.status === '1';
          testResult.message = 'BSCScan API key is valid';
        } catch (error: any) {
          testResult.message = `BSCScan API error: ${error.response?.data?.result || error.message}`;
        }
        break;
        
      default:
        testResult.message = `No test available for ${keyName}`;
        testResult.success = false;
    }
    
    return NextResponse.json(testResult);
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}