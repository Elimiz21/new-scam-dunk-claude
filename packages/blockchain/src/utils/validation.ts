import { BlockchainNetwork } from '../types';
import Web3 from 'web3';
import { PublicKey } from '@solana/web3.js';

export class ValidationUtils {
  /**
   * Validate Ethereum-like address (Ethereum, BSC, Polygon)
   */
  static isValidEthereumAddress(address: string): boolean {
    try {
      return Web3.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Solana address
   */
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Bitcoin address
   */
  static isValidBitcoinAddress(address: string): boolean {
    // Basic Bitcoin address validation
    const legacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const segwitPattern = /^bc1[a-z0-9]{39,59}$/;
    const testnetPattern = /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const testnetSegwitPattern = /^tb1[a-z0-9]{39,59}$/;
    
    return legacyPattern.test(address) || 
           segwitPattern.test(address) ||
           testnetPattern.test(address) ||
           testnetSegwitPattern.test(address);
  }

  /**
   * Validate address for specific network
   */
  static isValidAddressForNetwork(address: string, network: BlockchainNetwork): boolean {
    switch (network) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        return this.isValidEthereumAddress(address);
      case 'solana':
        return this.isValidSolanaAddress(address);
      case 'bitcoin':
        return this.isValidBitcoinAddress(address);
      default:
        return false;
    }
  }

  /**
   * Validate transaction hash for specific network
   */
  static isValidTransactionHash(hash: string, network: BlockchainNetwork): boolean {
    switch (network) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        // Ethereum-like transaction hashes are 66 characters (0x + 64 hex chars)
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
      case 'solana':
        // Solana transaction signatures are base58 encoded, typically 87-88 characters
        return /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(hash);
      case 'bitcoin':
        // Bitcoin transaction hashes are 64 hex characters (no 0x prefix)
        return /^[a-fA-F0-9]{64}$/.test(hash);
      default:
        return false;
    }
  }

  /**
   * Validate block number
   */
  static isValidBlockNumber(blockNumber: number | string): boolean {
    const num = typeof blockNumber === 'string' ? parseInt(blockNumber, 10) : blockNumber;
    return !isNaN(num) && num >= 0 && num < Number.MAX_SAFE_INTEGER;
  }

  /**
   * Validate amount/value
   */
  static isValidAmount(amount: string | number): boolean {
    try {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount;
      return !isNaN(num) && num >= 0 && isFinite(num);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate hex string
   */
  static isValidHexString(hex: string): boolean {
    return /^0x[a-fA-F0-9]*$/.test(hex);
  }

  /**
   * Validate contract ABI
   */
  static isValidABI(abi: any): boolean {
    try {
      if (!Array.isArray(abi)) return false;
      
      for (const item of abi) {
        if (!item.type || typeof item.type !== 'string') return false;
        if (!['function', 'event', 'constructor', 'fallback', 'receive'].includes(item.type)) return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate timestamp
   */
  static isValidTimestamp(timestamp: number | string | Date): boolean {
    try {
      const date = new Date(timestamp);
      return date instanceof Date && !isNaN(date.getTime());
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate risk level
   */
  static isValidRiskLevel(level: string): level is 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(level);
  }

  /**
   * Validate percentage (0-100)
   */
  static isValidPercentage(percentage: number): boolean {
    return typeof percentage === 'number' && percentage >= 0 && percentage <= 100 && !isNaN(percentage);
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Validate URL
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate network name
   */
  static isValidNetwork(network: string): network is BlockchainNetwork {
    return ['ethereum', 'bsc', 'polygon', 'solana', 'bitcoin'].includes(network);
  }

  /**
   * Normalize address (lowercase for Ethereum-like, preserve case for others)
   */
  static normalizeAddress(address: string, network: BlockchainNetwork): string {
    switch (network) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        return address.toLowerCase();
      case 'solana':
      case 'bitcoin':
      default:
        return address;
    }
  }

  /**
   * Validate and normalize contract address
   */
  static validateAndNormalizeAddress(address: string, network: BlockchainNetwork): string | null {
    if (!this.isValidAddressForNetwork(address, network)) {
      return null;
    }
    return this.normalizeAddress(address, network);
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page: number, limit: number): { page: number; limit: number } {
    const validPage = Math.max(1, Math.floor(page) || 1);
    const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));
    
    return { page: validPage, limit: validLimit };
  }

  /**
   * Validate sort parameters
   */
  static validateSort(sort: string, allowedFields: string[]): { field: string; direction: 'asc' | 'desc' } {
    const [field, direction] = sort.split(':');
    
    const validField = allowedFields.includes(field) ? field : allowedFields[0];
    const validDirection = ['asc', 'desc'].includes(direction) ? direction as 'asc' | 'desc' : 'desc';
    
    return { field: validField, direction: validDirection };
  }

  /**
   * Validate time range
   */
  static validateTimeRange(startTime?: string | number, endTime?: string | number): {
    startTime: Date;
    endTime: Date;
  } {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    let start = defaultStart;
    let end = now;
    
    if (startTime) {
      const startDate = new Date(startTime);
      if (this.isValidTimestamp(startDate)) {
        start = startDate;
      }
    }
    
    if (endTime) {
      const endDate = new Date(endTime);
      if (this.isValidTimestamp(endDate)) {
        end = endDate;
      }
    }
    
    // Ensure start is before end
    if (start >= end) {
      start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour before end
    }
    
    return { startTime: start, endTime: end };
  }

  /**
   * Validate gas price (in wei)
   */
  static isValidGasPrice(gasPrice: string | number): boolean {
    try {
      const price = typeof gasPrice === 'string' ? parseFloat(gasPrice) : gasPrice;
      return !isNaN(price) && price > 0 && price < 1e18; // Less than 1 ETH in wei
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate gas limit
   */
  static isValidGasLimit(gasLimit: string | number): boolean {
    try {
      const limit = typeof gasLimit === 'string' ? parseInt(gasLimit, 10) : gasLimit;
      return !isNaN(limit) && limit > 0 && limit <= 30000000; // Reasonable gas limit
    } catch (error) {
      return false;
    }
  }
}

export default ValidationUtils;