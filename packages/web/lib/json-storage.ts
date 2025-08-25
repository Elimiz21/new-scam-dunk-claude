/**
 * JSON-based storage for API keys
 * This works without any database dependency
 */

// In-memory cache that persists for the lifetime of the serverless function
let memoryCache: Record<string, any> = {};
let lastCacheUpdate = 0;

interface StoredKey {
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class JsonApiKeyStorage {
  private static instance: JsonApiKeyStorage;
  private keys: Map<string, StoredKey> = new Map();
  
  private constructor() {
    this.loadFromMemory();
  }
  
  static getInstance(): JsonApiKeyStorage {
    if (!JsonApiKeyStorage.instance) {
      JsonApiKeyStorage.instance = new JsonApiKeyStorage();
    }
    return JsonApiKeyStorage.instance;
  }
  
  private loadFromMemory() {
    // Load from memory cache
    Object.entries(memoryCache).forEach(([key, value]) => {
      this.keys.set(key, value as StoredKey);
    });
  }
  
  private saveToMemory() {
    // Save to memory cache
    memoryCache = {};
    this.keys.forEach((value, key) => {
      memoryCache[key] = value;
    });
    lastCacheUpdate = Date.now();
  }
  
  async getAllKeys(): Promise<StoredKey[]> {
    // Also check environment variables as fallback
    this.checkEnvVars();
    return Array.from(this.keys.values());
  }
  
  async getKey(keyName: string): Promise<StoredKey | null> {
    // Check memory first
    if (this.keys.has(keyName)) {
      return this.keys.get(keyName) || null;
    }
    
    // Check environment variable
    const envValue = process.env[keyName];
    if (envValue) {
      const key: StoredKey = {
        key_name: keyName,
        key_value: envValue,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.keys.set(keyName, key);
      return key;
    }
    
    return null;
  }
  
  async saveKey(keyName: string, keyValue: string): Promise<boolean> {
    const key: StoredKey = {
      key_name: keyName,
      key_value: keyValue,
      is_active: true,
      created_at: this.keys.get(keyName)?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.keys.set(keyName, key);
    this.saveToMemory();
    
    console.log(`Saved key ${keyName} to JSON storage (${this.keys.size} total keys)`);
    return true;
  }
  
  async deleteKey(keyName: string): Promise<boolean> {
    const key = this.keys.get(keyName);
    if (key) {
      key.is_active = false;
      this.saveToMemory();
      return true;
    }
    return false;
  }
  
  private checkEnvVars() {
    // List of API keys to check in environment
    const envKeys = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'COINMARKETCAP_API_KEY',
      'ALPHA_VANTAGE_API_KEY',
      'ETHERSCAN_API_KEY',
      'COINGECKO_API_KEY',
      'NEWS_API_KEY'
    ];
    
    envKeys.forEach(keyName => {
      const envValue = process.env[keyName];
      if (envValue && !this.keys.has(keyName)) {
        this.keys.set(keyName, {
          key_name: keyName,
          key_value: envValue,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  }
  
  // Get statistics
  getStats() {
    return {
      totalKeys: this.keys.size,
      activeKeys: Array.from(this.keys.values()).filter(k => k.is_active).length,
      lastUpdate: lastCacheUpdate,
      cacheAge: Date.now() - lastCacheUpdate
    };
  }
}