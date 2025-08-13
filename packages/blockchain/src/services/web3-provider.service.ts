import Web3 from 'web3';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { BlockchainNetwork } from '../types';

export class Web3ProviderService {
  private static instance: Web3ProviderService;
  private web3Providers: Map<string, Web3> = new Map();
  private ethersProviders: Map<string, ethers.JsonRpcProvider> = new Map();
  private solanaConnection: Connection | null = null;

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): Web3ProviderService {
    if (!Web3ProviderService.instance) {
      Web3ProviderService.instance = new Web3ProviderService();
    }
    return Web3ProviderService.instance;
  }

  private initializeProviders(): void {
    // Initialize Ethereum providers
    this.initializeEthereumProviders();
    // Initialize BSC providers
    this.initializeBSCProviders();
    // Initialize Polygon providers
    this.initializePolygonProviders();
    // Initialize Solana connection
    this.initializeSolanaConnection();
  }

  private initializeEthereumProviders(): void {
    const rpcUrls = config.blockchain.ethereum.rpcUrls.filter(url => url && !url.includes('your-api-key'));
    
    if (rpcUrls.length > 0) {
      const web3 = new Web3(rpcUrls[0]);
      const ethersProvider = new ethers.JsonRpcProvider(rpcUrls[0]);
      
      this.web3Providers.set('ethereum', web3);
      this.ethersProviders.set('ethereum', ethersProvider);
      
      logger.info('Ethereum providers initialized');
    } else {
      logger.warn('No valid Ethereum RPC URLs configured');
    }
  }

  private initializeBSCProviders(): void {
    const rpcUrls = config.blockchain.bsc.rpcUrls.filter(url => url);
    
    if (rpcUrls.length > 0) {
      const web3 = new Web3(rpcUrls[0]);
      const ethersProvider = new ethers.JsonRpcProvider(rpcUrls[0]);
      
      this.web3Providers.set('bsc', web3);
      this.ethersProviders.set('bsc', ethersProvider);
      
      logger.info('BSC providers initialized');
    } else {
      logger.warn('No valid BSC RPC URLs configured');
    }
  }

  private initializePolygonProviders(): void {
    const rpcUrls = config.blockchain.polygon.rpcUrls.filter(url => url);
    
    if (rpcUrls.length > 0) {
      const web3 = new Web3(rpcUrls[0]);
      const ethersProvider = new ethers.JsonRpcProvider(rpcUrls[0]);
      
      this.web3Providers.set('polygon', web3);
      this.ethersProviders.set('polygon', ethersProvider);
      
      logger.info('Polygon providers initialized');
    } else {
      logger.warn('No valid Polygon RPC URLs configured');
    }
  }

  private initializeSolanaConnection(): void {
    const rpcUrls = config.blockchain.solana.rpcUrls.filter(url => url);
    
    if (rpcUrls.length > 0) {
      this.solanaConnection = new Connection(rpcUrls[0], 'confirmed');
      logger.info('Solana connection initialized');
    } else {
      logger.warn('No valid Solana RPC URLs configured');
    }
  }

  public getWeb3Provider(network: BlockchainNetwork): Web3 | null {
    const provider = this.web3Providers.get(network);
    if (!provider) {
      logger.error(`Web3 provider not found for network: ${network}`);
      return null;
    }
    return provider;
  }

  public getEthersProvider(network: BlockchainNetwork): ethers.JsonRpcProvider | null {
    const provider = this.ethersProviders.get(network);
    if (!provider) {
      logger.error(`Ethers provider not found for network: ${network}`);
      return null;
    }
    return provider;
  }

  public getSolanaConnection(): Connection | null {
    if (!this.solanaConnection) {
      logger.error('Solana connection not initialized');
      return null;
    }
    return this.solanaConnection;
  }

  public async isValidAddress(address: string, network: BlockchainNetwork): Promise<boolean> {
    try {
      switch (network) {
        case 'ethereum':
        case 'bsc':
        case 'polygon':
          const web3 = this.getWeb3Provider(network);
          return web3 ? web3.utils.isAddress(address) : false;
        
        case 'solana':
          try {
            new PublicKey(address);
            return true;
          } catch {
            return false;
          }
        
        case 'bitcoin':
          // Basic Bitcoin address validation
          return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
        
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Address validation error for ${address} on ${network}:`, error);
      return false;
    }
  }

  public async getBlockNumber(network: BlockchainNetwork): Promise<number | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const blockNumber = await web3.eth.getBlockNumber();
      return Number(blockNumber);
    } catch (error) {
      logger.error(`Failed to get block number for ${network}:`, error);
      return null;
    }
  }

  public async getBalance(address: string, network: BlockchainNetwork): Promise<string | null> {
    try {
      switch (network) {
        case 'ethereum':
        case 'bsc':
        case 'polygon':
          const web3 = this.getWeb3Provider(network);
          if (!web3) return null;
          
          const polygonBalance = await web3.eth.getBalance(address);
          return web3.utils.fromWei(polygonBalance, 'ether');
        
        case 'solana':
          const connection = this.getSolanaConnection();
          if (!connection) return null;
          
          const publicKey = new PublicKey(address);
          const solanaBalance = await connection.getBalance(publicKey);
          return (solanaBalance / 1e9).toString(); // Convert lamports to SOL
        
        case 'bitcoin':
          // Bitcoin balance lookup would require a different API
          return null;
        
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Failed to get balance for ${address} on ${network}:`, error);
      return null;
    }
  }

  public async getTransactionCount(address: string, network: BlockchainNetwork): Promise<number | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const txCount = await web3.eth.getTransactionCount(address);
      return Number(txCount);
    } catch (error) {
      logger.error(`Failed to get transaction count for ${address} on ${network}:`, error);
      return null;
    }
  }

  public async getTransaction(hash: string, network: BlockchainNetwork): Promise<any | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const tx = await web3.eth.getTransaction(hash);
      return tx;
    } catch (error) {
      logger.error(`Failed to get transaction ${hash} on ${network}:`, error);
      return null;
    }
  }

  public async getTransactionReceipt(hash: string, network: BlockchainNetwork): Promise<any | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const receipt = await web3.eth.getTransactionReceipt(hash);
      return receipt;
    } catch (error) {
      logger.error(`Failed to get transaction receipt ${hash} on ${network}:`, error);
      return null;
    }
  }

  public async getContractCode(address: string, network: BlockchainNetwork): Promise<string | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const code = await web3.eth.getCode(address);
      return code;
    } catch (error) {
      logger.error(`Failed to get contract code for ${address} on ${network}:`, error);
      return null;
    }
  }

  public async callContractMethod(
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[] = [],
    network: BlockchainNetwork
  ): Promise<any> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) throw new Error(`Web3 provider not available for ${network}`);
      
      const contract = new web3.eth.Contract(abi, contractAddress);
      const result = await contract.methods[methodName](...params).call();
      return result;
    } catch (error) {
      logger.error(`Failed to call contract method ${methodName} on ${contractAddress}:`, error);
      throw error;
    }
  }

  public async getGasPrice(network: BlockchainNetwork): Promise<string | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const gasPrice = await web3.eth.getGasPrice();
      return gasPrice.toString();
    } catch (error) {
      logger.error(`Failed to get gas price for ${network}:`, error);
      return null;
    }
  }

  public async estimateGas(
    to: string,
    data: string,
    network: BlockchainNetwork,
    from?: string
  ): Promise<number | null> {
    try {
      const web3 = this.getWeb3Provider(network);
      if (!web3) return null;
      
      const gas = await web3.eth.estimateGas({
        to,
        data,
        from: from || '0x0000000000000000000000000000000000000000',
      });
      return Number(gas);
    } catch (error) {
      logger.error(`Failed to estimate gas for ${to} on ${network}:`, error);
      return null;
    }
  }

  public async testConnection(network: BlockchainNetwork): Promise<boolean> {
    try {
      const blockNumber = await this.getBlockNumber(network);
      return blockNumber !== null && blockNumber > 0;
    } catch (error) {
      logger.error(`Connection test failed for ${network}:`, error);
      return false;
    }
  }

  public getSupportedNetworks(): BlockchainNetwork[] {
    return ['ethereum', 'bsc', 'polygon', 'solana', 'bitcoin'];
  }

  public async switchProvider(network: BlockchainNetwork, rpcUrl: string): Promise<boolean> {
    try {
      const web3 = new Web3(rpcUrl);
      const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test the connection
      const blockNumber = await web3.eth.getBlockNumber();
      if (blockNumber) {
        this.web3Providers.set(network, web3);
        this.ethersProviders.set(network, ethersProvider);
        logger.info(`Switched provider for ${network} to ${rpcUrl}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to switch provider for ${network} to ${rpcUrl}:`, error);
      return false;
    }
  }
}