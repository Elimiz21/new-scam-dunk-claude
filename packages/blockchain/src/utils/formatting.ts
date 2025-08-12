import BigNumber from 'bignumber.js';
import { BlockchainNetwork } from '../types';

export class FormattingUtils {
  /**
   * Format token amount with proper decimals
   */
  static formatTokenAmount(amount: string | number, decimals: number): string {
    try {
      const bn = new BigNumber(amount);
      const divisor = new BigNumber(10).pow(decimals);
      return bn.dividedBy(divisor).toFixed();
    } catch (error) {
      return '0';
    }
  }

  /**
   * Format currency amount with proper symbol and decimals
   */
  static formatCurrency(amount: number, currency = 'USD', decimals = 2): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    } catch (error) {
      return `${amount.toFixed(decimals)} ${currency}`;
    }
  }

  /**
   * Format percentage with proper symbol
   */
  static formatPercentage(value: number, decimals = 2): string {
    try {
      return `${value.toFixed(decimals)}%`;
    } catch (error) {
      return '0.00%';
    }
  }

  /**
   * Format large numbers with K, M, B suffixes
   */
  static formatLargeNumber(num: number): string {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  /**
   * Format address for display (truncate middle)
   */
  static formatAddress(address: string, startChars = 6, endChars = 4): string {
    if (!address || address.length <= startChars + endChars) {
      return address || '';
    }
    
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Format transaction hash for display
   */
  static formatTransactionHash(hash: string, chars = 8): string {
    if (!hash || hash.length <= chars * 2) {
      return hash || '';
    }
    
    return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
  }

  /**
   * Format timestamp to human readable string
   */
  static formatTimestamp(timestamp: number | Date, format = 'full'): string {
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
      
      switch (format) {
        case 'full':
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        case 'date':
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        case 'time':
          return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        case 'relative':
          return this.formatRelativeTime(date);
        default:
          return date.toString();
      }
    } catch (error) {
      return 'Invalid Date';
    }
  }

  /**
   * Format time difference (e.g., "2 minutes ago")
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  /**
   * Format duration in seconds to human readable string
   */
  static formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }

  /**
   * Format wei to ether
   */
  static formatWeiToEther(wei: string | number): string {
    try {
      const bn = new BigNumber(wei);
      const ether = bn.dividedBy(new BigNumber(10).pow(18));
      return ether.toFixed(6); // 6 decimal places for ether
    } catch (error) {
      return '0';
    }
  }

  /**
   * Format gas price in gwei
   */
  static formatGasPrice(gasPrice: string | number): string {
    try {
      const bn = new BigNumber(gasPrice);
      const gwei = bn.dividedBy(new BigNumber(10).pow(9));
      return `${gwei.toFixed(2)} Gwei`;
    } catch (error) {
      return '0 Gwei';
    }
  }

  /**
   * Format market cap
   */
  static formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    }
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    }
    if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    if (marketCap >= 1e3) {
      return `$${(marketCap / 1e3).toFixed(2)}K`;
    }
    return `$${marketCap.toFixed(2)}`;
  }

  /**
   * Format volume
   */
  static formatVolume(volume: number): string {
    return this.formatMarketCap(volume); // Same formatting as market cap
  }

  /**
   * Format risk score with color indication
   */
  static formatRiskScore(score: number): { score: string; color: string; level: string } {
    const roundedScore = Math.round(score);
    
    let color: string;
    let level: string;
    
    if (score >= 80) {
      color = '#dc2626'; // red-600
      level = 'CRITICAL';
    } else if (score >= 60) {
      color = '#ea580c'; // orange-600
      level = 'HIGH';
    } else if (score >= 30) {
      color = '#ca8a04'; // yellow-600
      level = 'MEDIUM';
    } else {
      color = '#16a34a'; // green-600
      level = 'LOW';
    }
    
    return {
      score: `${roundedScore}/100`,
      color,
      level,
    };
  }

  /**
   * Format network name for display
   */
  static formatNetworkName(network: BlockchainNetwork): string {
    const networkNames = {
      ethereum: 'Ethereum',
      bsc: 'Binance Smart Chain',
      polygon: 'Polygon',
      solana: 'Solana',
      bitcoin: 'Bitcoin',
    };
    
    return networkNames[network] || network;
  }

  /**
   * Format token symbol for display
   */
  static formatTokenSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  /**
   * Format price change with proper sign and color
   */
  static formatPriceChange(change: number): { 
    formatted: string; 
    color: string; 
    isPositive: boolean 
  } {
    const isPositive = change >= 0;
    const formatted = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
    const color = isPositive ? '#16a34a' : '#dc2626'; // green or red
    
    return {
      formatted,
      color,
      isPositive,
    };
  }

  /**
   * Format bytes to human readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format contract verification status
   */
  static formatVerificationStatus(verified: boolean): {
    status: string;
    color: string;
    icon: string;
  } {
    return verified
      ? { status: 'Verified', color: '#16a34a', icon: '✓' }
      : { status: 'Unverified', color: '#dc2626', icon: '✗' };
  }

  /**
   * Format liquidity amount
   */
  static formatLiquidity(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num)) return '$0';
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    
    return `$${num.toFixed(2)}`;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    
    return `${text.slice(0, maxLength - 3)}...`;
  }

  /**
   * Format confidence score
   */
  static formatConfidence(confidence: number): string {
    return `${Math.round(confidence)}%`;
  }

  /**
   * Format holder count
   */
  static formatHolderCount(count: number): string {
    if (count >= 1e6) {
      return `${(count / 1e6).toFixed(1)}M`;
    }
    if (count >= 1e3) {
      return `${(count / 1e3).toFixed(1)}K`;
    }
    return count.toString();
  }
}

export default FormattingUtils;