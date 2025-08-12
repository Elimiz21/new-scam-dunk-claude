import dotenv from 'dotenv';

dotenv.config();

export interface BlockchainConfig {
  server: {
    port: number;
    corsOrigins: string[];
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
  redis: {
    url: string;
    ttl: {
      tokenData: number;
      contractAnalysis: number;
      priceData: number;
      walletReputation: number;
    };
  };
  blockchain: {
    ethereum: {
      rpcUrls: string[];
      etherscanApiKey: string;
    };
    bsc: {
      rpcUrls: string[];
      bscscanApiKey: string;
    };
    polygon: {
      rpcUrls: string[];
      polygonscanApiKey: string;
    };
    solana: {
      rpcUrls: string[];
    };
    bitcoin: {
      rpcUrls: string[];
    };
  };
  external: {
    coingecko: {
      apiKey?: string;
      baseUrl: string;
    };
    coinmarketcap: {
      apiKey: string;
      baseUrl: string;
    };
    defipulse: {
      apiKey?: string;
      baseUrl: string;
    };
  };
  security: {
    jwtSecret: string;
    apiKeys: string[];
  };
}

export const config: BlockchainConfig = {
  server: {
    port: parseInt(process.env.PORT || '3002', 10),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: {
      tokenData: parseInt(process.env.REDIS_TTL_TOKEN_DATA || '300', 10), // 5 minutes
      contractAnalysis: parseInt(process.env.REDIS_TTL_CONTRACT_ANALYSIS || '1800', 10), // 30 minutes
      priceData: parseInt(process.env.REDIS_TTL_PRICE_DATA || '60', 10), // 1 minute
      walletReputation: parseInt(process.env.REDIS_TTL_WALLET_REPUTATION || '3600', 10), // 1 hour
    },
  },
  blockchain: {
    ethereum: {
      rpcUrls: [
        process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        'https://mainnet.infura.io/v3/your-api-key',
        'https://rpc.ankr.com/eth',
      ],
      etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
    },
    bsc: {
      rpcUrls: [
        process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
        'https://bsc-dataseed2.binance.org/',
        'https://bsc-dataseed3.binance.org/',
      ],
      bscscanApiKey: process.env.BSCSCAN_API_KEY || '',
    },
    polygon: {
      rpcUrls: [
        process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com/',
        'https://rpc-mainnet.matic.network',
        'https://rpc-mainnet.maticvigil.com',
      ],
      polygonscanApiKey: process.env.POLYGONSCAN_API_KEY || '',
    },
    solana: {
      rpcUrls: [
        process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com',
      ],
    },
    bitcoin: {
      rpcUrls: [
        process.env.BITCOIN_RPC_URL || 'https://blockstream.info/api',
        'https://blockchain.info',
      ],
    },
  },
  external: {
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3',
    },
    coinmarketcap: {
      apiKey: process.env.COINMARKETCAP_API_KEY || '',
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    },
    defipulse: {
      apiKey: process.env.DEFIPULSE_API_KEY,
      baseUrl: 'https://data-api.defipulse.com',
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    apiKeys: process.env.API_KEYS?.split(',') || [],
  },
};

export default config;