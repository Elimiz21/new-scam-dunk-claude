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

    const { symbol, assetType = 'stock' } = await request.json();
    
    if (!symbol) {
      return corsResponse({
        success: false,
        error: 'Symbol is required'
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
    
    let riskScore = 0; // Track risk score separately
    
    let result = {
      symbol: symbol.toUpperCase(),
      assetType,
      overallRiskScore: 0,
      riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      confidence: 0,
      summary: '',
      keyFindings: [] as string[],
      recommendations: [] as string[],
      alertLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      marketData: {} as any,
      manipulationIndicators: [] as string[]
    };
    
    const dataSources = [];
    
    // Analyze based on asset type
    if (assetType === 'crypto' || assetType === 'cryptocurrency') {
      // Try CoinGecko API for crypto data
      const coinGeckoKey = await storage.getKey('COINGECKO_API_KEY');
      
      try {
        // First, search for the coin ID
        const searchResponse = await axios.get(
          `https://api.coingecko.com/api/v3/search?query=${symbol}`,
          coinGeckoKey ? { headers: { 'x-cg-pro-api-key': coinGeckoKey } } : {}
        );
        
        const coin = searchResponse.data?.coins?.[0];
        
        if (coin) {
          dataSources.push('coingecko');
          
          // Get detailed coin data
          const coinDataResponse = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=false`,
            coinGeckoKey ? { headers: { 'x-cg-pro-api-key': coinGeckoKey } } : {}
          );
          
          const coinData = coinDataResponse.data;
          
          result.marketData.coingecko = {
            name: coinData.name,
            symbol: coinData.symbol,
            marketCap: coinData.market_data?.market_cap?.usd,
            currentPrice: coinData.market_data?.current_price?.usd,
            priceChange24h: coinData.market_data?.price_change_percentage_24h,
            priceChange7d: coinData.market_data?.price_change_percentage_7d,
            volume24h: coinData.market_data?.total_volume?.usd,
            circulatingSupply: coinData.market_data?.circulating_supply,
            totalSupply: coinData.market_data?.total_supply,
            ath: coinData.market_data?.ath?.usd,
            athDate: coinData.market_data?.ath_date?.usd,
            trustScore: coinData.coingecko_score
          };
          
          // Analyze for manipulation indicators
          const marketCap = coinData.market_data?.market_cap?.usd || 0;
          const volume = coinData.market_data?.total_volume?.usd || 0;
          const priceChange24h = Math.abs(coinData.market_data?.price_change_percentage_24h || 0);
          const priceChange7d = Math.abs(coinData.market_data?.price_change_percentage_7d || 0);
          
          // Check for pump and dump indicators
          if (priceChange24h > 50) {
            result.manipulationIndicators.push('Extreme price volatility (24h)');
            riskScore += 30;
          }
          
          if (priceChange7d > 100) {
            result.manipulationIndicators.push('Suspicious price surge (7d)');
            riskScore += 25;
          }
          
          // Low market cap = higher risk
          if (marketCap < 1000000) {
            result.manipulationIndicators.push('Very low market cap (high manipulation risk)');
            riskScore += 35;
          } else if (marketCap < 10000000) {
            result.manipulationIndicators.push('Low market cap');
            riskScore += 20;
          }
          
          // Check volume to market cap ratio
          if (marketCap > 0) {
            const volumeRatio = volume / marketCap;
            if (volumeRatio > 2) {
              result.manipulationIndicators.push('Abnormally high trading volume');
              riskScore += 25;
            } else if (volumeRatio < 0.01) {
              result.manipulationIndicators.push('Very low liquidity');
              riskScore += 20;
            }
          }
          
          // Check if it's a new coin (high risk)
          const athDate = new Date(coinData.market_data?.ath_date?.usd || '');
          const daysSinceATH = (Date.now() - athDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceATH < 30) {
            result.manipulationIndicators.push('Very new or recently pumped');
            riskScore += 20;
          }
          
        } else {
          result.keyFindings.push('Cryptocurrency not found in major exchanges');
          riskScore += 50;
        }
      } catch (error) {
        console.error('CoinGecko API error:', error);
      }
      
      // Try CoinMarketCap API as backup
      const coinMarketCapKey = await storage.getKey('COINMARKETCAP_API_KEY');
      if (coinMarketCapKey && !result.marketData.coingecko) {
        try {
          const cmcResponse = await axios.get(
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
            {
              params: { symbol: symbol.toUpperCase() },
              headers: { 'X-CMC_PRO_API_KEY': coinMarketCapKey }
            }
          );
          
          const data = Object.values(cmcResponse.data?.data || {})[0] as any;
          if (data) {
            dataSources.push('coinmarketcap');
            result.marketData.coinmarketcap = {
              name: data.name,
              symbol: data.symbol,
              marketCap: data.quote?.USD?.market_cap,
              price: data.quote?.USD?.price,
              volume24h: data.quote?.USD?.volume_24h,
              percentChange24h: data.quote?.USD?.percent_change_24h,
              percentChange7d: data.quote?.USD?.percent_change_7d
            };
          }
        } catch (error) {
          console.error('CoinMarketCap API error:', error);
        }
      }
      
    } else {
      // Stock analysis
      // Try Alpha Vantage API for stock data
      const alphaVantageKey = await storage.getKey('ALPHA_VANTAGE_API_KEY');
      if (alphaVantageKey) {
        try {
          console.log(`Fetching stock data for ${symbol} from Alpha Vantage`);
          // Get quote data
          const quoteResponse = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
          );
          
          console.log('Alpha Vantage response:', JSON.stringify(quoteResponse.data).substring(0, 200));
          
          if (quoteResponse.data['Global Quote'] && Object.keys(quoteResponse.data['Global Quote']).length > 0) {
            dataSources.push('alphavantage');
            const quote = quoteResponse.data['Global Quote'];
            
            result.marketData.alphavantage = {
              symbol: quote['01. symbol'],
              price: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: quote['10. change percent'],
              volume: parseInt(quote['06. volume']),
              previousClose: parseFloat(quote['08. previous close'])
            };
            
            // Get company overview for more details
            const overviewResponse = await axios.get(
              `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`
            );
            
            if (overviewResponse.data?.Symbol) {
              const overview = overviewResponse.data;
              result.marketData.company = {
                name: overview.Name,
                exchange: overview.Exchange,
                sector: overview.Sector,
                marketCap: parseInt(overview.MarketCapitalization),
                peRatio: parseFloat(overview.PERatio),
                eps: parseFloat(overview.EPS),
                beta: parseFloat(overview.Beta),
                dividendYield: parseFloat(overview.DividendYield)
              };
              
              // Check for manipulation indicators
              const marketCap = parseInt(overview.MarketCapitalization) || 0;
              const peRatio = parseFloat(overview.PERatio) || 0;
              
              // Penny stock check
              if (result.marketData.alphavantage.price < 5) {
                result.manipulationIndicators.push('Penny stock (high manipulation risk)');
                riskScore += 30;
              }
              
              // Small cap check
              if (marketCap < 300000000) {
                result.manipulationIndicators.push('Small cap stock (higher volatility)');
                riskScore += 20;
              }
              
              // Unusual P/E ratio
              if (peRatio < 0) {
                result.manipulationIndicators.push('Negative P/E ratio (unprofitable)');
                riskScore += 25;
              } else if (peRatio > 100) {
                result.manipulationIndicators.push('Extremely high P/E ratio');
                riskScore += 20;
              }
              
              // OTC or non-major exchange
              if (!['NYSE', 'NASDAQ', 'AMEX'].includes(overview.Exchange)) {
                result.manipulationIndicators.push('Not listed on major exchange');
                riskScore += 25;
              }
            }
            
            // Check for unusual trading patterns
            const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
            if (Math.abs(changePercent) > 20) {
              result.manipulationIndicators.push('Extreme daily price movement');
              riskScore += 30;
            }
            
          } else if (quoteResponse.data['Note']) {
            result.keyFindings.push('API rate limit reached - please try again later');
            console.log('Alpha Vantage rate limit:', quoteResponse.data['Note']);
          } else if (quoteResponse.data['Information']) {
            result.keyFindings.push('API call frequency limit - please wait and retry');
            console.log('Alpha Vantage info:', quoteResponse.data['Information']);
          } else if (quoteResponse.data['Error Message']) {
            result.keyFindings.push(`Invalid stock symbol: ${symbol}`);
            riskScore += 40;
            console.log('Alpha Vantage error:', quoteResponse.data['Error Message']);
          } else {
            result.keyFindings.push('Unable to retrieve stock data - API may be unavailable');
            console.log('Unexpected Alpha Vantage response:', quoteResponse.data);
          }
        } catch (error: any) {
          console.error('Alpha Vantage API error:', error.message);
          result.keyFindings.push('Stock data service temporarily unavailable');
        }
      } else {
        result.keyFindings.push('Stock analysis unavailable - API key not configured');
        console.log('Alpha Vantage API key not found');
      }
      
      // Try NewsAPI for sentiment analysis
      const newsApiKey = await storage.getKey('NEWS_API_KEY');
      if (newsApiKey) {
        try {
          const newsResponse = await axios.get(
            `https://newsapi.org/v2/everything?q=${symbol}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`
          );
          
          if (newsResponse.data?.articles) {
            const recentArticles = newsResponse.data.articles.slice(0, 5);
            dataSources.push('newsapi');
            
            // Simple sentiment analysis based on titles
            const negativeWords = ['scam', 'fraud', 'investigation', 'lawsuit', 'crash', 'plunge', 'scandal', 'manipulation', 'sec', 'charged'];
            const positiveWords = ['surge', 'growth', 'profit', 'success', 'breakthrough', 'innovation'];
            
            let negativeCount = 0;
            let positiveCount = 0;
            
            recentArticles.forEach((article: any) => {
              const text = (article.title + ' ' + article.description).toLowerCase();
              negativeWords.forEach(word => {
                if (text.includes(word)) negativeCount++;
              });
              positiveWords.forEach(word => {
                if (text.includes(word)) positiveCount++;
              });
            });
            
            if (negativeCount > positiveCount * 2) {
              result.manipulationIndicators.push('Negative news sentiment');
              riskScore += 20;
            }
            
            result.marketData.newsSentiment = {
              articlesAnalyzed: recentArticles.length,
              negativeSignals: negativeCount,
              positiveSignals: positiveCount
            };
          }
        } catch (error) {
          console.error('NewsAPI error:', error);
        }
      }
    }
    
    // Common scam patterns for both stocks and crypto
    const scamPatterns = [
      { pattern: /PUMP/i, indicator: 'Name contains pump indicator' },
      { pattern: /MOON/i, indicator: 'Name contains hype language' },
      { pattern: /100X|1000X/i, indicator: 'Unrealistic return promises' },
      { pattern: /ELON|MUSK/i, indicator: 'Celebrity impersonation' },
      { pattern: /SAFE/i, indicator: 'Overemphasis on safety (common in scams)' }
    ];
    
    scamPatterns.forEach(({ pattern, indicator }) => {
      if (pattern.test(symbol)) {
        result.manipulationIndicators.push(indicator);
        riskScore += 25;
      }
    });
    
    // If no data sources were available, provide basic analysis
    if (dataSources.length === 0) {
      // Provide more detailed explanation when no data is available
      if (assetType === 'crypto' || assetType === 'cryptocurrency') {
        if (!result.keyFindings.some(f => f.includes('not found'))) {
          result.keyFindings.push(`Unable to find cryptocurrency "${symbol}" in market databases`);
        }
        result.keyFindings.push('Verify the correct symbol on CoinGecko or CoinMarketCap');
        result.keyFindings.push('Many scam tokens use similar names to legitimate projects');
        riskScore += 30;
      } else {
        if (!result.keyFindings.some(f => f.includes('API'))) {
          result.keyFindings.push(`Unable to retrieve data for stock symbol "${symbol.toUpperCase()}"`);
        }
        result.keyFindings.push('Please verify this is a valid ticker symbol');
        result.keyFindings.push('Check if the stock is listed on major exchanges (NYSE, NASDAQ)');
      }
      result.confidence = 30;
    } else {
      result.confidence = Math.min(95, 50 + (dataSources.length * 15));
    }
    
    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);
    result.overallRiskScore = riskScore;
    
    // Determine risk level based on score
    if (riskScore >= 75) {
      result.riskLevel = 'CRITICAL';
      result.alertLevel = 'CRITICAL';
    } else if (riskScore >= 50) {
      result.riskLevel = 'HIGH';
      result.alertLevel = 'HIGH';
    } else if (riskScore >= 25) {
      result.riskLevel = 'MEDIUM';
      result.alertLevel = 'MEDIUM';
    } else {
      result.riskLevel = 'LOW';
      result.alertLevel = 'LOW';
    }
    
    // Generate summary
    if (dataSources.length === 0) {
      result.summary = `Unable to complete trading analysis for ${symbol.toUpperCase()}. ${result.keyFindings[0]}`;
    } else if (result.manipulationIndicators.length > 0) {
      result.summary = `Trading analysis for ${symbol.toUpperCase()} detected ${result.manipulationIndicators.length} risk indicators. ${result.riskLevel} risk level assigned.`;
    } else {
      result.summary = `Trading analysis for ${symbol.toUpperCase()} completed using ${dataSources.join(', ')}. No significant manipulation indicators detected.`;
    }
    
    // Add key findings
    if (result.manipulationIndicators.length > 0) {
      result.keyFindings = result.keyFindings.concat(result.manipulationIndicators.slice(0, 3));
    }
    
    if (result.keyFindings.length === 0) {
      result.keyFindings.push('No major red flags detected');
      result.keyFindings.push(`Analyzed using ${dataSources.join(', ')}`);
    }
    
    // Generate recommendations
    if (result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH') {
      result.recommendations = [
        'Avoid trading this asset',
        'High risk of manipulation or scam',
        'Consult with a licensed financial advisor',
        'Report suspicious activity to authorities'
      ];
    } else if (result.riskLevel === 'MEDIUM') {
      result.recommendations = [
        'Exercise caution when trading',
        'Conduct thorough due diligence',
        'Consider the risks before investing',
        'Monitor for unusual activity'
      ];
    } else {
      result.recommendations = [
        'Asset appears legitimate',
        'Standard investment risks apply',
        'Continue monitoring market conditions',
        'Diversify your portfolio'
      ];
    }

    return corsResponse({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Trading analysis error:', error);
    return corsResponse(
      { error: 'Trading analysis failed' },
      500
    );
  }
}
