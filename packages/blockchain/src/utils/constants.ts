import { BlockchainNetwork } from '../types';

// Standard ERC-20 ABI
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
  'function transferFrom(address,address,uint256) returns (bool)',
  'event Transfer(address indexed,address indexed,uint256)',
  'event Approval(address indexed,address indexed,uint256)',
];

// Uniswap V2 Factory ABI
export const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address,address) view returns (address)',
  'function allPairs(uint256) view returns (address)',
  'function allPairsLength() view returns (uint256)',
  'function createPair(address,address) returns (address)',
  'event PairCreated(address indexed,address indexed,address,uint256)',
];

// Uniswap V2 Pair ABI
export const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() view returns (uint112,uint112,uint32)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function price0CumulativeLast() view returns (uint256)',
  'function price1CumulativeLast() view returns (uint256)',
  'function kLast() view returns (uint256)',
  'event Mint(address indexed,uint256,uint256)',
  'event Burn(address indexed,uint256,uint256,address indexed)',
  'event Swap(address indexed,uint256,uint256,uint256,uint256,address indexed)',
  'event Sync(uint112,uint112)',
];

// Network configurations
export const NETWORK_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://mainnet.infura.io/v3/',
      'https://eth-mainnet.g.alchemy.com/v2/',
      'https://rpc.ankr.com/eth',
    ],
    blockExplorer: 'https://etherscan.io',
    blockExplorerApi: 'https://api.etherscan.io/api',
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: [
      'https://bsc-dataseed1.binance.org/',
      'https://bsc-dataseed2.binance.org/',
      'https://bsc-dataseed3.binance.org/',
    ],
    blockExplorer: 'https://bscscan.com',
    blockExplorerApi: 'https://api.bscscan.com/api',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: [
      'https://polygon-rpc.com/',
      'https://rpc-mainnet.matic.network',
      'https://rpc-mainnet.maticvigil.com',
    ],
    blockExplorer: 'https://polygonscan.com',
    blockExplorerApi: 'https://api.polygonscan.com/api',
  },
  solana: {
    chainId: 0, // Solana doesn't use EVM chain IDs
    name: 'Solana',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9,
    },
    rpcUrls: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
    ],
    blockExplorer: 'https://explorer.solana.com',
    blockExplorerApi: 'https://api.solana.com',
  },
  bitcoin: {
    chainId: 0, // Bitcoin doesn't use EVM chain IDs
    name: 'Bitcoin',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
    rpcUrls: [
      'https://blockstream.info/api',
      'https://blockchain.info',
    ],
    blockExplorer: 'https://blockstream.info',
    blockExplorerApi: 'https://blockstream.info/api',
  },
} as const;

// DEX factory addresses for each network
export const DEX_FACTORIES: Record<BlockchainNetwork, Array<{ name: string; address: string }>> = {
  ethereum: [
    { name: 'Uniswap V2', address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f' },
    { name: 'Uniswap V3', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984' },
    { name: 'SushiSwap', address: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac' },
    { name: 'Balancer V2', address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8' },
  ],
  bsc: [
    { name: 'PancakeSwap V2', address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73' },
    { name: 'PancakeSwap V1', address: '0xBCfCcbde45cE874adCB698cC183deBcF17952812' },
    { name: 'MDEX', address: '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8' },
    { name: 'BakerySwap', address: '0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7' },
  ],
  polygon: [
    { name: 'QuickSwap', address: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32' },
    { name: 'SushiSwap', address: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4' },
    { name: 'Dfyn', address: '0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B' },
  ],
  solana: [],
  bitcoin: [],
};

// Base token addresses for each network (used for finding pairs)
export const BASE_TOKENS: Record<BlockchainNetwork, Array<{ name: string; address: string; decimals: number }>> = {
  ethereum: [
    { name: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { name: 'USDC', address: '0xA0b86a33E6441C44D10c9c2B18ddE2e8D0eB9B08', decimals: 6 },
    { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    { name: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  ],
  bsc: [
    { name: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    { name: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    { name: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    { name: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    { name: 'ETH', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
  ],
  polygon: [
    { name: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    { name: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    { name: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    { name: 'DAI', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
    { name: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
  ],
  solana: [],
  bitcoin: [],
};

// Known contract addresses for various protocols
export const PROTOCOL_ADDRESSES = {
  ethereum: {
    // Uniswap
    UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    
    // Curve
    CURVE_REGISTRY: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
    
    // Compound
    COMPOUND_COMPTROLLER: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
    
    // Aave
    AAVE_LENDING_POOL: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    
    // MakerDAO
    MAKER_MCD_VAT: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
  },
  bsc: {
    // PancakeSwap
    PANCAKESWAP_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    PANCAKESWAP_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    
    // Venus
    VENUS_COMPTROLLER: '0xfD36E2c2a6789Db23113685031d7F16329158384',
  },
  polygon: {
    // QuickSwap
    QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    
    // Aave
    AAVE_LENDING_POOL: '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf',
  },
};

// Risk scoring weights
export const RISK_WEIGHTS = {
  HONEYPOT: 0.25,
  RUG_PULL: 0.30,
  LIQUIDITY: 0.20,
  OWNERSHIP: 0.15,
  TRADING: 0.10,
} as const;

// Risk level thresholds
export const RISK_THRESHOLDS = {
  LOW: 0,
  MEDIUM: 30,
  HIGH: 60,
  CRITICAL: 80,
} as const;

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  TOKEN_DATA: 300, // 5 minutes
  PRICE_DATA: 60, // 1 minute
  CONTRACT_ANALYSIS: 1800, // 30 minutes
  WALLET_REPUTATION: 3600, // 1 hour
  HISTORICAL_DATA: 7200, // 2 hours
} as const;

// API rate limits
export const RATE_LIMITS = {
  COINGECKO: { requests: 10, window: 60000 }, // 10 requests per minute
  COINMARKETCAP: { requests: 30, window: 60000 }, // 30 requests per minute
  ETHERSCAN: { requests: 5, window: 1000 }, // 5 requests per second
  DEFIPULSE: { requests: 20, window: 60000 }, // 20 requests per minute
} as const;

// Known dangerous function signatures
export const DANGEROUS_FUNCTIONS = [
  'renounceOwnership()',
  'transferOwnership(address)',
  'mint(uint256)',
  'mint(address,uint256)',
  'burn(uint256)',
  'burnFrom(address,uint256)',
  'setTaxFee(uint256)',
  'setLiquidityFee(uint256)',
  'excludeFromFee(address)',
  'includeInFee(address)',
  'setSwapAndLiquifyEnabled(bool)',
  'pause()',
  'unpause()',
  'blacklist(address)',
  'unblacklist(address)',
  'setMaxTxAmount(uint256)',
  'setMinTokensBeforeSwap(uint256)',
] as const;

// Known honeypot patterns (regex patterns)
export const HONEYPOT_PATTERNS = [
  /require\s*\(\s*from\s*!=\s*uniswapV2Pair/gi,
  /require\s*\(\s*amount\s*<=\s*maxTxAmount/gi,
  /if\s*\(\s*to\s*==\s*uniswapV2Pair\s*\)/gi,
  /modifier\s+onlyOwner/gi,
  /transfer.*revert/gi,
  /balanceOf.*transfer.*false/gi,
] as const;

// Known rug pull indicators (regex patterns)
export const RUG_PULL_PATTERNS = [
  /removeLiquidity/gi,
  /emergencyWithdraw/gi,
  /migrateLiquidity/gi,
  /teamWithdraw/gi,
  /devWithdraw/gi,
  /rugPull/gi,
  /withdrawETH/gi,
  /withdrawToken/gi,
] as const;

// Known scammer addresses (this would be loaded from a database in production)
export const KNOWN_SCAMMER_ADDRESSES = new Set([
  // Add known scammer addresses here
  '0x0000000000000000000000000000000000000000', // Example
]);

// Known phishing addresses
export const KNOWN_PHISHING_ADDRESSES = new Set([
  // Add known phishing addresses here
  '0x0000000000000000000000000000000000000000', // Example
]);

// Known mixer/tumbler addresses
export const KNOWN_MIXER_ADDRESSES = new Set([
  // Tornado Cash
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc',
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936',
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf',
  '0xa160cdab225685da1d56aa342ad8841c3b53f291',
  '0xfd8610d20aa15b7b2e3be39b396a1bc3516c7144',
  // Add more mixer addresses
]);

// Suspicious transaction patterns
export const SUSPICIOUS_PATTERNS = {
  RAPID_TRANSFERS: 'rapid_consecutive_transfers',
  ROUND_AMOUNTS: 'round_number_transactions',
  MEV_BOT: 'mev_bot_behavior',
  SANDWICH_ATTACK: 'sandwich_attack',
  FLASH_LOAN: 'flash_loan_usage',
  LARGE_TRANSFERS: 'unusually_large_transfers',
  DUST_ATTACKS: 'dust_attack_transactions',
} as const;

// Default pagination limits
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

// API response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export default {
  ERC20_ABI,
  UNISWAP_V2_FACTORY_ABI,
  UNISWAP_V2_PAIR_ABI,
  NETWORK_CONFIGS,
  DEX_FACTORIES,
  BASE_TOKENS,
  PROTOCOL_ADDRESSES,
  RISK_WEIGHTS,
  RISK_THRESHOLDS,
  CACHE_TTL,
  RATE_LIMITS,
  DANGEROUS_FUNCTIONS,
  HONEYPOT_PATTERNS,
  RUG_PULL_PATTERNS,
  KNOWN_SCAMMER_ADDRESSES,
  KNOWN_PHISHING_ADDRESSES,
  KNOWN_MIXER_ADDRESSES,
  SUSPICIOUS_PATTERNS,
  PAGINATION,
  HTTP_STATUS,
};