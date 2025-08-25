'use client';

import { useState, useEffect } from 'react';

interface SavedApiKey {
  keyName: string;
  value: string;
  savedAt: string;
}

const STORAGE_KEY = 'scamdunk_api_keys_backup';

export function useApiKeysBackup() {
  const [localKeys, setLocalKeys] = useState<Record<string, SavedApiKey>>({});

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocalKeys(parsed);
          console.log('Loaded API keys from local backup:', Object.keys(parsed).length);
        }
      } catch (error) {
        console.error('Failed to load local API keys:', error);
      }
    }
  }, []);

  // Save a key to localStorage
  const saveLocalKey = (keyName: string, value: string) => {
    const newKey: SavedApiKey = {
      keyName,
      value,
      savedAt: new Date().toISOString()
    };

    const updated = {
      ...localKeys,
      [keyName]: newKey
    };

    setLocalKeys(updated);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log(`Saved ${keyName} to local backup`);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  };

  // Get a key from localStorage
  const getLocalKey = (keyName: string): string | null => {
    return localKeys[keyName]?.value || null;
  };

  // Check if a key exists locally
  const hasLocalKey = (keyName: string): boolean => {
    return !!localKeys[keyName];
  };

  // Clear all local keys
  const clearLocalKeys = () => {
    setLocalKeys({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    localKeys,
    saveLocalKey,
    getLocalKey,
    hasLocalKey,
    clearLocalKeys
  };
}