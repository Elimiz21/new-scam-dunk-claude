import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CacheEntry } from '../types';

export class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private connected = false;

  private constructor() {
    this.client = new Redis(config.redis.url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.connected = false;
    });

    this.client.on('close', () => {
      this.connected = false;
      logger.warn('Redis connection closed');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      const cacheEntry: CacheEntry<T> = {
        data: value,
        timestamp: new Date(),
        ttl: ttl || config.redis.ttl.tokenData,
      };

      const serialized = JSON.stringify(cacheEntry);
      
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const cached = await this.client.get(key);
      if (!cached) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache entry has expired
      const now = new Date().getTime();
      const cacheTime = new Date(cacheEntry.timestamp).getTime();
      const ttlMs = cacheEntry.ttl * 1000;

      if (now - cacheTime > ttlMs) {
        await this.delete(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error);
    }
  }

  public async deletePattern(pattern: string): Promise<void> {
    if (!this.connected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error(`Redis delete pattern error for pattern ${pattern}:`, error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.connected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  public async increment(key: string, ttl?: number): Promise<number> {
    if (!this.connected) return 0;

    try {
      const result = await this.client.incr(key);
      if (ttl && result === 1) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error(`Redis increment error for key ${key}:`, error);
      return 0;
    }
  }

  public async setHash(key: string, hash: Record<string, any>, ttl?: number): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.hmset(key, hash);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
    } catch (error) {
      logger.error(`Redis setHash error for key ${key}:`, error);
    }
  }

  public async getHash(key: string): Promise<Record<string, string> | null> {
    if (!this.connected) return null;

    try {
      const hash = await this.client.hgetall(key);
      return Object.keys(hash).length > 0 ? hash : null;
    } catch (error) {
      logger.error(`Redis getHash error for key ${key}:`, error);
      return null;
    }
  }

  public async pushToList(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.lpush(key, JSON.stringify(value));
      if (ttl) {
        await this.client.expire(key, ttl);
      }
    } catch (error) {
      logger.error(`Redis pushToList error for key ${key}:`, error);
    }
  }

  public async getList(key: string, start = 0, stop = -1): Promise<any[]> {
    if (!this.connected) return [];

    try {
      const items = await this.client.lrange(key, start, stop);
      return items.map(item => JSON.parse(item));
    } catch (error) {
      logger.error(`Redis getList error for key ${key}:`, error);
      return [];
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}