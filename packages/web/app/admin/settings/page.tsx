'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, ArrowLeft, Info, Check, X, Loader2, Eye, EyeOff,
  TestTube, Save, AlertCircle, ExternalLink, Copy, Key
} from 'lucide-react';

interface ApiKeyConfig {
  key: string;
  name: string;
  description: string;
  instructions: string;
  testEndpoint: string | null;
  required: boolean;
  currentValue?: { value: string; isActive: boolean };
  isConfigured?: boolean;
}

interface ApiKeyCategory {
  category: string;
  keys: ApiKeyConfig[];
}

export default function AdminSettings() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
    fetchApiKeys();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  };

  const fetchApiKeys = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/api-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (keyName: string) => {
    const token = localStorage.getItem('adminToken');
    const keyValue = editingKeys[keyName];
    
    if (!keyValue) return;
    
    setSavingKeys({ ...savingKeys, [keyName]: true });
    
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyName, keyValue })
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh the keys list
        await fetchApiKeys();
        // Clear the editing value
        setEditingKeys({ ...editingKeys, [keyName]: '' });
        // Show success in test results
        setTestResults({
          ...testResults,
          [keyName]: { success: true, message: 'API key saved successfully' }
        });
      }
    } catch (error) {
      setTestResults({
        ...testResults,
        [keyName]: { success: false, message: 'Failed to save API key' }
      });
    } finally {
      setSavingKeys({ ...savingKeys, [keyName]: false });
    }
  };

  const handleTestKey = async (keyName: string, testEndpoint: string | null) => {
    const token = localStorage.getItem('adminToken');
    const keyValue = editingKeys[keyName] || '';
    
    if (!keyValue) {
      setTestResults({
        ...testResults,
        [keyName]: { success: false, message: 'Please enter an API key first' }
      });
      return;
    }
    
    setTestingKeys({ ...testingKeys, [keyName]: true });
    
    try {
      const response = await fetch('/api/admin/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keyName, keyValue, testEndpoint })
      });
      
      const data = await response.json();
      setTestResults({
        ...testResults,
        [keyName]: data
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        [keyName]: { success: false, message: 'Test failed' }
      });
    } finally {
      setTestingKeys({ ...testingKeys, [keyName]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/admin/dashboard"
                className="mr-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                API Keys Management
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold mb-2">Important Instructions</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Configure API keys to enable real scam detection capabilities</li>
                <li>• Keys marked as "Required" are essential for core functionality</li>
                <li>• Test each key after entering to verify it works correctly</li>
                <li>• Keys are securely stored and encrypted in the database</li>
              </ul>
            </div>
          </div>
        </div>

        {/* API Keys by Category */}
        {apiKeys.map((category) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-purple-400" />
              {category.category}
            </h2>
            
            <div className="space-y-4">
              {category.keys.map((apiKey) => (
                <div
                  key={apiKey.key}
                  className="bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {apiKey.name}
                        </h3>
                        {apiKey.required && (
                          <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                            Required
                          </span>
                        )}
                        {apiKey.isConfigured && (
                          <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Configured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{apiKey.description}</p>
                      
                      {/* Instructions */}
                      <div className="flex items-start mb-4">
                        <Info className="w-4 h-4 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-500 text-xs">
                          {apiKey.instructions}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type={showKeys[apiKey.key] ? 'text' : 'password'}
                          value={editingKeys[apiKey.key] || ''}
                          onChange={(e) => setEditingKeys({
                            ...editingKeys,
                            [apiKey.key]: e.target.value
                          })}
                          placeholder={apiKey.currentValue?.value || 'Enter API key'}
                          className="w-full px-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <button
                          onClick={() => setShowKeys({
                            ...showKeys,
                            [apiKey.key]: !showKeys[apiKey.key]
                          })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
                        >
                          {showKeys[apiKey.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Test Button */}
                      <button
                        onClick={() => handleTestKey(apiKey.key, apiKey.testEndpoint)}
                        disabled={testingKeys[apiKey.key] || !apiKey.testEndpoint}
                        className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {testingKeys[apiKey.key] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        <span className="ml-2">Test</span>
                      </button>
                      
                      {/* Save Button */}
                      <button
                        onClick={() => handleSaveKey(apiKey.key)}
                        disabled={savingKeys[apiKey.key] || !editingKeys[apiKey.key]}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {savingKeys[apiKey.key] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="ml-2">Save</span>
                      </button>
                    </div>
                    
                    {/* Test Results */}
                    <AnimatePresence>
                      {testResults[apiKey.key] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`p-3 rounded-lg text-sm flex items-start ${
                            testResults[apiKey.key].success
                              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                              : 'bg-red-500/10 border border-red-500/30 text-red-400'
                          }`}
                        >
                          {testResults[apiKey.key].success ? (
                            <Check className="w-4 h-4 mr-2 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 mr-2 mt-0.5" />
                          )}
                          <span>{testResults[apiKey.key].message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Save All Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}