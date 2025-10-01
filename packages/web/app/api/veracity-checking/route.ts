import { NextRequest } from 'next/server';
import axios from 'axios';
import { corsResponse, corsOptionsResponse } from '@/lib/cors';
import { getApiKeysStorage } from '@/lib/api-keys-storage';
import { getSupabaseClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth/server-auth';

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { targetType, targetIdentifier } = await request.json();
    
    if (!targetType || !targetIdentifier) {
      return corsResponse({
        success: false,
        error: 'Target type and identifier are required'
      }, 400);
    }
    
    // Initialize Supabase and get API keys
    const supabase = getSupabaseClient();
    const storage = getApiKeysStorage(supabase);
    
    if (!supabase) {
      return corsResponse(
        {
          success: false,
          error: 'Database connection failed',
        },
        500
      );
    }
    
    let result = {
      targetType,
      targetIdentifier,
      isVerified: false,
      verificationStatus: 'UNVERIFIED' as 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS' | 'SCAM',
      overallConfidence: 0,
      riskLevel: 'UNKNOWN' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN',
      summary: '',
      keyFindings: [] as string[],
      recommendations: [] as string[],
      verificationSources: [] as string[],
      details: {} as any
    };
    
    const warnings = [] as string[];
    let riskScore = 0;
    
    if (targetType === 'stock' || targetType === 'company') {
      // Verify stock/company existence
      const alphaVantageKey = await storage.getKey('ALPHA_VANTAGE_API_KEY');
      
      if (alphaVantageKey) {
        try {
          // Search for company
          const searchResponse = await axios.get(
            `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${targetIdentifier}&apikey=${alphaVantageKey}`
          );
          
          const matches = searchResponse.data?.bestMatches || [];
          
          if (matches.length > 0) {
            result.verificationSources.push('alphavantage');
            const topMatch = matches[0];
            
            result.details.company = {
              symbol: topMatch['1. symbol'],
              name: topMatch['2. name'],
              type: topMatch['3. type'],
              region: topMatch['4. region'],
              currency: topMatch['8. currency'],
              matchScore: parseFloat(topMatch['9. matchScore'])
            };
            
            // Get company overview for verification
            const overviewResponse = await axios.get(
              `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${topMatch['1. symbol']}&apikey=${alphaVantageKey}`
            );
            
            if (overviewResponse.data?.Symbol) {
              const overview = overviewResponse.data;
              result.isVerified = true;
              result.verificationStatus = 'VERIFIED';
              
              result.details.companyInfo = {
                exchange: overview.Exchange,
                sector: overview.Sector,
                industry: overview.Industry,
                marketCap: overview.MarketCapitalization,
                country: overview.Country,
                fiscalYearEnd: overview.FiscalYearEnd,
                cik: overview.CIK
              };
              
              // Check exchange legitimacy
              const legitimateExchanges = ['NYSE', 'NASDAQ', 'AMEX', 'LSE', 'TSX', 'ASX', 'HKEX'];
              if (!legitimateExchanges.includes(overview.Exchange)) {
                warnings.push('Not listed on major exchange');
                riskScore += 30;
              }
              
              // Check for CIK (SEC registration)
              if (overview.CIK) {
                result.keyFindings.push('SEC registered company (has CIK)');
                result.overallConfidence += 30;
              }
              
            } else if (searchResponse.data?.['Note']) {
              result.keyFindings.push('API rate limit reached');
            }
          } else {
            result.verificationStatus = 'UNVERIFIED';
            warnings.push('Company/stock not found in market data');
            riskScore += 50;
          }
        } catch (error) {
          console.error('Alpha Vantage verification error:', error);
        }
      }
      
      // Check SEC EDGAR database (simulate - would need SEC API)
      if (targetIdentifier.match(/^[A-Z]{1,5}$/)) {
        // Looks like a valid ticker symbol
        result.verificationSources.push('pattern-check');
        
        // Known fake company patterns
        const fakePatterns = ['SCAM', 'FAKE', 'TEST', 'PUMP'];
        if (fakePatterns.some(pattern => targetIdentifier.includes(pattern))) {
          result.verificationStatus = 'SCAM';
          warnings.push('Ticker matches known scam patterns');
          riskScore += 80;
        }
      }
      
    } else if (targetType === 'crypto' || targetType === 'cryptocurrency' || targetType === 'token') {
      // Verify cryptocurrency existence
      const coinGeckoKey = await storage.getKey('COINGECKO_API_KEY');
      
      try {
        // Search for the cryptocurrency
        const searchResponse = await axios.get(
          `https://api.coingecko.com/api/v3/search?query=${targetIdentifier}`,
          coinGeckoKey ? { headers: { 'x-cg-pro-api-key': coinGeckoKey } } : {}
        );
        
        const coins = searchResponse.data?.coins || [];
        
        if (coins.length > 0) {
          result.verificationSources.push('coingecko');
          const coin = coins[0];
          
          // Get detailed coin data
          const coinResponse = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false`,
            coinGeckoKey ? { headers: { 'x-cg-pro-api-key': coinGeckoKey } } : {}
          );
          
          const coinData = coinResponse.data;
          
          result.isVerified = true;
          result.verificationStatus = 'VERIFIED';
          
          result.details.crypto = {
            id: coinData.id,
            symbol: coinData.symbol,
            name: coinData.name,
            platforms: Object.keys(coinData.platforms || {}),
            categories: coinData.categories,
            description: coinData.description?.en?.substring(0, 200),
            genesisDate: coinData.genesis_date,
            marketCapRank: coinData.market_cap_rank,
            coingeckoRank: coinData.coingecko_rank,
            coingeckoScore: coinData.coingecko_score,
            developerScore: coinData.developer_score,
            communityScore: coinData.community_score,
            liquidityScore: coinData.liquidity_score,
            publicInterestScore: coinData.public_interest_score
          };
          
          // Risk assessment based on scores
          if (coinData.market_cap_rank > 1000 || !coinData.market_cap_rank) {
            warnings.push('Low market cap rank or unranked');
            riskScore += 30;
          }
          
          if (coinData.coingecko_score < 30) {
            warnings.push('Low CoinGecko trust score');
            riskScore += 25;
          }
          
          if (coinData.liquidity_score < 30) {
            warnings.push('Low liquidity score');
            riskScore += 20;
          }
          
          // Check for rug pull indicators
          const rugPullKeywords = ['safe', 'moon', 'elon', 'inu', 'baby', 'mini', 'micro'];
          if (rugPullKeywords.some(keyword => coinData.name.toLowerCase().includes(keyword))) {
            warnings.push('Name contains common scam token keywords');
            riskScore += 35;
          }
          
          // Check if it's on Ethereum/BSC (common for scams)
          if (coinData.platforms?.['binance-smart-chain'] || coinData.platforms?.ethereum) {
            const contractAddress = coinData.platforms?.['binance-smart-chain'] || coinData.platforms?.ethereum;
            
            // Try to verify smart contract (if we have Etherscan/BSCScan API)
            const etherscanKey = await storage.getKey('ETHERSCAN_API_KEY');
            const bscscanKey = await storage.getKey('BSCSCAN_API_KEY');
            
            if (etherscanKey && coinData.platforms?.ethereum) {
              try {
                const contractResponse = await axios.get(
                  `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanKey}`
                );
                
                if (contractResponse.data?.status === '1') {
                  result.keyFindings.push('Smart contract verified on Etherscan');
                  result.overallConfidence += 20;
                } else {
                  warnings.push('Smart contract not verified');
                  riskScore += 15;
                }
              } catch (error) {
                console.error('Etherscan verification error:', error);
              }
            }
          }
          
        } else {
          result.verificationStatus = 'UNVERIFIED';
          warnings.push('Cryptocurrency not found on major exchanges');
          riskScore += 60;
        }
      } catch (error) {
        console.error('CoinGecko verification error:', error);
      }
      
      // Try CoinMarketCap as backup
      const coinMarketCapKey = await storage.getKey('COINMARKETCAP_API_KEY');
      if (coinMarketCapKey && !result.isVerified) {
        try {
          const cmcResponse = await axios.get(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info',
            {
              params: { symbol: targetIdentifier.toUpperCase() },
              headers: { 'X-CMC_PRO_API_KEY': coinMarketCapKey }
            }
          );
          
          const data = Object.values(cmcResponse.data?.data || {})[0] as any;
          if (data) {
            result.verificationSources.push('coinmarketcap');
            result.isVerified = true;
            result.verificationStatus = 'VERIFIED';
            
            result.details.coinmarketcap = {
              name: data.name,
              symbol: data.symbol,
              slug: data.slug,
              dateAdded: data.date_added,
              tags: data.tags,
              platform: data.platform,
              category: data.category,
              description: data.description?.substring(0, 200)
            };
          }
        } catch (error) {
          console.error('CoinMarketCap verification error:', error);
        }
      }
      
    } else if (targetType === 'website' || targetType === 'platform' || targetType === 'exchange') {
      // Verify website/platform legitimacy
      result.verificationSources.push('pattern-analysis');
      
      // Check for common scam patterns in domain names
      const scamDomainPatterns = [
        /\.(tk|ml|ga|cf)$/i, // Free domains often used in scams
        /-official|-real|-genuine|-legit/i, // Overcompensating names
        /bitcoin.*profit|crypto.*quick|forex.*signal/i, // Common scam combinations
        /[0-9]{4,}/i, // Many numbers in domain
        /xn--/i, // Punycode (possible phishing)
      ];
      
      let domainRiskScore = 0;
      scamDomainPatterns.forEach(pattern => {
        if (pattern.test(targetIdentifier)) {
          warnings.push(`Domain matches scam pattern: ${pattern.source}`);
          domainRiskScore += 20;
        }
      });
      
      riskScore += domainRiskScore;
      
      // Check against known scam platforms
      const knownScamPlatforms = [
        'btc-profit', 'crypto-genius', 'bitcoin-era', 'immediate-edge',
        'bitcoin-revolution', 'crypto-engine', 'bitcoin-loophole'
      ];
      
      const identifierLower = targetIdentifier.toLowerCase();
      if (knownScamPlatforms.some(scam => identifierLower.includes(scam))) {
        result.verificationStatus = 'SCAM';
        warnings.push('Matches known scam platform');
        riskScore += 80;
      }
      
      // Check if it's a known legitimate platform
      const legitimatePlatforms = [
        'coinbase', 'binance', 'kraken', 'gemini', 'bitstamp',
        'robinhood', 'etrade', 'fidelity', 'schwab', 'vanguard'
      ];
      
      if (legitimatePlatforms.some(platform => identifierLower.includes(platform))) {
        // But check for impersonation
        if (!identifierLower.match(new RegExp(`^(www\\.)?${legitimatePlatforms.find(p => identifierLower.includes(p))}\\.com?$`))) {
          warnings.push('Possible impersonation of legitimate platform');
          riskScore += 60;
          result.verificationStatus = 'SUSPICIOUS';
        } else {
          result.isVerified = true;
          result.verificationStatus = 'VERIFIED';
          result.keyFindings.push('Recognized legitimate platform');
        }
      }
    }
    
    // Calculate confidence based on verification sources
    if (result.verificationSources.length === 0) {
      result.overallConfidence = 20;
      result.keyFindings.push('Limited verification data available');
    } else {
      result.overallConfidence = Math.min(95, result.overallConfidence + (result.verificationSources.length * 25));
    }
    
    // Determine risk level based on risk score
    if (riskScore >= 70) {
      result.riskLevel = 'CRITICAL';
    } else if (riskScore >= 50) {
      result.riskLevel = 'HIGH';
    } else if (riskScore >= 30) {
      result.riskLevel = 'MEDIUM';
    } else if (riskScore > 0) {
      result.riskLevel = 'LOW';
    } else if (result.isVerified) {
      result.riskLevel = 'LOW';
    } else {
      result.riskLevel = 'UNKNOWN';
    }
    
    // Add warnings to key findings
    if (warnings.length > 0) {
      result.keyFindings = result.keyFindings.concat(warnings.slice(0, 3));
    }
    
    // Add verification status to findings
    if (result.isVerified) {
      result.keyFindings.unshift(`Entity verified through ${result.verificationSources.join(', ')}`);
    } else if (result.verificationStatus === 'SCAM') {
      result.keyFindings.unshift('HIGH RISK: Entity identified as likely scam');
    } else if (result.verificationStatus === 'SUSPICIOUS') {
      result.keyFindings.unshift('WARNING: Entity shows suspicious characteristics');
    } else {
      result.keyFindings.unshift('Entity could not be verified');
    }
    
    // Generate summary
    if (result.verificationStatus === 'VERIFIED') {
      result.summary = `${targetIdentifier} has been verified as a legitimate ${targetType}.`;
    } else if (result.verificationStatus === 'SCAM') {
      result.summary = `WARNING: ${targetIdentifier} appears to be a scam or fraudulent ${targetType}.`;
    } else if (result.verificationStatus === 'SUSPICIOUS') {
      result.summary = `${targetIdentifier} shows suspicious characteristics and requires further investigation.`;
    } else {
      result.summary = `Unable to verify ${targetIdentifier} as a legitimate ${targetType}.`;
    }
    
    // Generate recommendations
    if (result.verificationStatus === 'VERIFIED' && result.riskLevel === 'LOW') {
      result.recommendations = [
        'Entity appears legitimate based on verification',
        'Continue with standard due diligence',
        'Monitor for any unusual activity',
        'Verify through additional sources if needed'
      ];
    } else if (result.verificationStatus === 'SCAM' || result.riskLevel === 'CRITICAL') {
      result.recommendations = [
        'AVOID this entity completely',
        'Do not provide any personal or financial information',
        'Report to relevant authorities',
        'Warn others about this potential scam'
      ];
    } else if (result.verificationStatus === 'SUSPICIOUS' || result.riskLevel === 'HIGH') {
      result.recommendations = [
        'Exercise extreme caution',
        'Seek independent verification',
        'Do not invest or provide sensitive information',
        'Research thoroughly before proceeding'
      ];
    } else if (result.riskLevel === 'MEDIUM') {
      result.recommendations = [
        'Proceed with caution',
        'Verify through multiple sources',
        'Start with small amounts if transacting',
        'Monitor closely for red flags'
      ];
    } else {
      result.recommendations = [
        'Unable to fully verify - exercise caution',
        'Seek additional verification sources',
        'Consider the risks carefully',
        'Consult with experts if unsure'
      ];
    }

    return corsResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Veracity checking error:', error);
    return corsResponse(
      { error: 'Veracity checking failed' },
      500
    );
  }
}
