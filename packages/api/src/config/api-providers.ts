export const apiProviders = {
  // Contact Verification APIs
  contactVerification: {
    truecaller: {
      baseUrl: 'https://api.truecaller.com/v2',
      apiKey: process.env.TRUECALLER_API_KEY || 'demo_key',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 5000,
      enabled: true
    },
    hunterIo: {
      baseUrl: 'https://api.hunter.io/v2',
      apiKey: process.env.HUNTER_IO_API_KEY || 'demo_key',
      rateLimit: { requests: 50, window: 60000 },
      timeout: 5000,
      enabled: true
    },
    emailRep: {
      baseUrl: 'https://emailrep.io',
      apiKey: process.env.EMAILREP_API_KEY || 'demo_key',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 5000,
      enabled: true
    },
    numverify: {
      baseUrl: 'https://apilayer.net/api',
      apiKey: process.env.NUMVERIFY_API_KEY || 'demo_key',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 5000,
      enabled: true
    }
  },

  // Trading Analysis APIs
  tradingAnalysis: {
    alphaVantage: {
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
      rateLimit: { requests: 5, window: 60000 },
      timeout: 10000,
      enabled: true
    },
    yahooFinance: {
      baseUrl: 'https://query1.finance.yahoo.com/v8',
      apiKey: process.env.YAHOO_FINANCE_API_KEY || '',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 10000,
      enabled: true
    },
    coinGecko: {
      baseUrl: 'https://api.coingecko.com/api/v3',
      apiKey: process.env.COINGECKO_API_KEY || '',
      rateLimit: { requests: 50, window: 60000 },
      timeout: 10000,
      enabled: true
    },
    coinMarketCap: {
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
      apiKey: process.env.COINMARKETCAP_API_KEY || 'demo_key',
      rateLimit: { requests: 30, window: 60000 },
      timeout: 10000,
      enabled: true
    },
    newsApi: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWS_API_KEY || 'demo_key',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 5000,
      enabled: true
    }
  },

  // Veracity Checking APIs
  veracityChecking: {
    secEdgar: {
      baseUrl: 'https://data.sec.gov/api',
      apiKey: process.env.SEC_EDGAR_API_KEY || '',
      rateLimit: { requests: 10, window: 1000 },
      timeout: 10000,
      enabled: true
    },
    finra: {
      baseUrl: 'https://api.finra.org',
      apiKey: process.env.FINRA_API_KEY || '',
      rateLimit: { requests: 20, window: 60000 },
      timeout: 10000,
      enabled: true
    },
    etherscan: {
      baseUrl: 'https://api.etherscan.io/api',
      apiKey: process.env.ETHERSCAN_API_KEY || 'demo_key',
      rateLimit: { requests: 5, window: 1000 },
      timeout: 10000,
      enabled: true
    },
    bscscan: {
      baseUrl: 'https://api.bscscan.com/api',
      apiKey: process.env.BSCSCAN_API_KEY || 'demo_key',
      rateLimit: { requests: 5, window: 1000 },
      timeout: 10000,
      enabled: true
    }
  },

  // AI Services
  aiServices: {
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || 'demo_key',
      model: 'gpt-4-turbo-preview',
      rateLimit: { requests: 50, window: 60000 },
      timeout: 30000,
      enabled: true
    },
    anthropic: {
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY || 'demo_key',
      model: 'claude-3-opus-20240229',
      rateLimit: { requests: 50, window: 60000 },
      timeout: 30000,
      enabled: false
    },
    huggingface: {
      baseUrl: 'https://api-inference.huggingface.co',
      apiKey: process.env.HUGGINGFACE_API_KEY || 'demo_key',
      model: 'microsoft/deberta-v3-base',
      rateLimit: { requests: 100, window: 60000 },
      timeout: 20000,
      enabled: true
    }
  },

  // Scammer Databases
  scammerDatabases: {
    fbiIc3: {
      baseUrl: 'https://api.ic3.gov',
      apiKey: process.env.FBI_IC3_API_KEY || '',
      rateLimit: { requests: 10, window: 60000 },
      timeout: 10000,
      enabled: false // Requires special access
    },
    ftcSentinel: {
      baseUrl: 'https://api.ftc.gov/sentinel',
      apiKey: process.env.FTC_SENTINEL_API_KEY || '',
      rateLimit: { requests: 20, window: 60000 },
      timeout: 10000,
      enabled: false // Requires special access
    },
    scammerInfo: {
      baseUrl: 'https://scammer.info/api',
      apiKey: process.env.SCAMMER_INFO_API_KEY || '',
      rateLimit: { requests: 50, window: 60000 },
      timeout: 5000,
      enabled: true
    },
    globalAntiScam: {
      baseUrl: 'https://www.globalantiscam.org/api',
      apiKey: process.env.GLOBAL_ANTISCAM_API_KEY || '',
      rateLimit: { requests: 30, window: 60000 },
      timeout: 5000,
      enabled: true
    }
  }
};

// Helper function to get enabled APIs
export function getEnabledApis(category: keyof typeof apiProviders) {
  return Object.entries(apiProviders[category])
    .filter(([_, config]) => config.enabled)
    .map(([name, config]) => ({ name, ...config }));
}

// Helper function to check if API is available
export function isApiAvailable(category: keyof typeof apiProviders, apiName: string): boolean {
  const api = apiProviders[category][apiName];
  return api?.enabled && !!api?.apiKey && api.apiKey !== 'demo_key';
}