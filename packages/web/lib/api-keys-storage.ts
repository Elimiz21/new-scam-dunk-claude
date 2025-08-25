/**
 * API Keys Storage with multiple fallback mechanisms
 * Handles both database and environment variable storage
 */

interface StoredApiKey {
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Hardcoded fallback keys from environment variables
const ENV_FALLBACK_KEYS: Record<string, string | undefined> = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  TRUECALLER_API_KEY: process.env.TRUECALLER_API_KEY,
  HUNTER_IO_API_KEY: process.env.HUNTER_IO_API_KEY,
  EMAILREP_API_KEY: process.env.EMAILREP_API_KEY,
  NUMVERIFY_API_KEY: process.env.NUMVERIFY_API_KEY,
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
  YAHOO_FINANCE_API_KEY: process.env.YAHOO_FINANCE_API_KEY,
  COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY,
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  BSCSCAN_API_KEY: process.env.BSCSCAN_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
};

// In-memory storage (persists during the session)
const memoryStorage = new Map<string, StoredApiKey>();

export class ApiKeysStorage {
  private supabase: any;
  
  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient;
  }
  
  /**
   * Get all stored API keys using fallback mechanisms
   */
  async getAllKeys(): Promise<StoredApiKey[]> {
    const keys: Map<string, StoredApiKey> = new Map();
    
    // Try database first
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('api_keys')
          .select('*')
          .eq('is_active', true);
        
        if (!error && data) {
          console.log(`Loaded ${data.length} keys from database`);
          data.forEach((key: StoredApiKey) => {
            keys.set(key.key_name, key);
          });
        }
      } catch (error) {
        console.error('Database fetch failed:', error);
      }
    }
    
    // Add memory storage keys
    memoryStorage.forEach((value, key) => {
      if (!keys.has(key)) {
        keys.set(key, value);
      }
    });
    
    // Add environment variable fallbacks
    Object.entries(ENV_FALLBACK_KEYS).forEach(([keyName, keyValue]) => {
      if (keyValue && !keys.has(keyName)) {
        keys.set(keyName, {
          key_name: keyName,
          key_value: keyValue,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    });
    
    return Array.from(keys.values());
  }
  
  /**
   * Save an API key using multiple storage mechanisms
   */
  async saveKey(keyName: string, keyValue: string): Promise<boolean> {
    const apiKey: StoredApiKey = {
      key_name: keyName,
      key_value: keyValue,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Always save to memory storage
    memoryStorage.set(keyName, apiKey);
    console.log(`Saved ${keyName} to memory storage`);
    
    // Try to save to database
    if (this.supabase) {
      try {
        // Check if key exists
        const { data: existing } = await this.supabase
          .from('api_keys')
          .select('id')
          .eq('key_name', keyName)
          .single();
        
        if (existing) {
          // Update existing
          const { error } = await this.supabase
            .from('api_keys')
            .update({
              key_value: keyValue,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('key_name', keyName);
          
          if (!error) {
            console.log(`Updated ${keyName} in database`);
            return true;
          }
        } else {
          // Insert new
          const { error } = await this.supabase
            .from('api_keys')
            .insert([apiKey]);
          
          if (!error) {
            console.log(`Inserted ${keyName} in database`);
            return true;
          }
        }
      } catch (error) {
        console.error('Database save failed:', error);
      }
    }
    
    // Return true since we at least saved to memory
    return true;
  }
  
  /**
   * Get a specific API key value
   */
  async getKey(keyName: string): Promise<string | null> {
    // Check memory storage first
    const memKey = memoryStorage.get(keyName);
    if (memKey?.key_value) {
      return memKey.key_value;
    }
    
    // Check database
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('api_keys')
          .select('key_value')
          .eq('key_name', keyName)
          .eq('is_active', true)
          .single();
        
        if (data?.key_value) {
          return data.key_value;
        }
      } catch (error) {
        console.error(`Failed to fetch ${keyName}:`, error);
      }
    }
    
    // Check environment variables
    return ENV_FALLBACK_KEYS[keyName] || null;
  }
  
  /**
   * Delete/deactivate an API key
   */
  async deleteKey(keyName: string): Promise<boolean> {
    // Remove from memory
    memoryStorage.delete(keyName);
    
    // Try to deactivate in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('key_name', keyName);
        return true;
      } catch (error) {
        console.error(`Failed to delete ${keyName}:`, error);
      }
    }
    
    return true;
  }
}

// Singleton instance
let storageInstance: ApiKeysStorage | null = null;

export function getApiKeysStorage(supabaseClient?: any): ApiKeysStorage {
  if (!storageInstance) {
    storageInstance = new ApiKeysStorage(supabaseClient);
  }
  return storageInstance;
}