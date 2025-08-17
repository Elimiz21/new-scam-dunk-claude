'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';

interface ScanTest {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
  color: string;
}

export function HolographicScan() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [overallRiskScore, setOverallRiskScore] = useState<number | null>(null);
  
  const [scanTests, setScanTests] = useState<ScanTest[]>([
    {
      id: 'contact',
      name: 'Contact Verification',
      description: 'Verify group members, managers, and contacts',
      icon: '/icons/contact-verification.svg',
      enabled: true,
      status: 'idle',
      progress: 0,
      color: 'from-holo-cyan to-holo-cyan-light'
    },
    {
      id: 'chat',
      name: 'Chat Analysis',
      description: 'Detect manipulation and scam patterns',
      icon: '/icons/chat-analysis.svg',
      enabled: true,
      status: 'idle',
      progress: 0,
      color: 'from-holo-green to-holo-green-light'
    },
    {
      id: 'trading',
      name: 'Trading Activity',
      description: 'Identify irregular trading patterns',
      icon: '/icons/trading-activity.svg',
      enabled: true,
      status: 'idle',
      progress: 0,
      color: 'from-holo-gray to-holo-gray-light'
    },
    {
      id: 'veracity',
      name: 'Veracity Check',
      description: 'Verify stock/crypto existence',
      icon: '/icons/asset-veracity.svg',
      enabled: true,
      status: 'idle',
      progress: 0,
      color: 'from-holo-amber to-holo-amber-light'
    }
  ]);

  const [inputData, setInputData] = useState({
    contacts: '',
    chatContent: '',
    ticker: '',
    additionalInfo: ''
  });

  const toggleTest = (testId: string) => {
    setScanTests(prev => 
      prev.map(test => 
        test.id === testId ? { ...test, enabled: !test.enabled } : test
      )
    );
  };

  const runComprehensiveScan = async () => {
    const enabledTests = scanTests.filter(test => test.enabled);
    if (enabledTests.length === 0) {
      toast({
        title: 'No Tests Selected',
        description: 'Please select at least one test to run.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setOverallRiskScore(null);
    setOverallProgress(0);

    // Reset all test statuses
    setScanTests(prev => prev.map(test => ({
      ...test,
      status: test.enabled ? 'running' : 'idle',
      progress: 0,
      result: undefined
    })));

    try {
      // Simulate running each test
      for (let i = 0; i < enabledTests.length; i++) {
        const test = enabledTests[i];
        
        // Update test status to running
        setScanTests(prev => prev.map(t => 
          t.id === test.id ? { ...t, status: 'running' } : t
        ));

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setScanTests(prev => prev.map(t => 
            t.id === test.id ? { ...t, progress } : t
          ));
          setOverallProgress(((i * 100) + progress) / enabledTests.length);
        }

        // Mark test as completed
        setScanTests(prev => prev.map(t => 
          t.id === test.id ? { 
            ...t, 
            status: 'completed',
            progress: 100,
            result: { riskScore: Math.floor(Math.random() * 50) + 10 }
          } : t
        ));
      }

      setOverallProgress(100);
      setScanComplete(true);
      setOverallRiskScore(35); // Mock overall score

      toast({
        title: 'Scan Complete',
        description: 'All selected tests have been completed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'An error occurred during the scan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { text: 'High Risk', color: 'text-holo-red', bg: 'bg-holo-red/20' };
    if (score >= 40) return { text: 'Medium Risk', color: 'text-holo-amber', bg: 'bg-holo-amber/20' };
    return { text: 'Low Risk', color: 'text-holo-green', bg: 'bg-holo-green/20' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="holo-text">Comprehensive Scan</span>
          </h1>
          <p className="text-xl text-gray-400">
            Run multiple verification tests to protect your investments
          </p>
        </motion.div>

        {/* Test Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Select Tests to Run</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scanTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  test.enabled 
                    ? 'border-holo-cyan bg-holo-cyan/10' 
                    : 'border-gray-700 bg-gray-800/30'
                }`}
                onClick={() => toggleTest(test.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Image
                      src={test.icon}
                      alt={test.name}
                      width={40}
                      height={40}
                      className="opacity-80"
                    />
                    {test.enabled && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-holo-cyan rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{test.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{test.description}</p>
                  </div>
                </div>
                
                {/* Status indicator */}
                {test.status !== 'idle' && (
                  <div className="mt-3">
                    {test.status === 'running' && (
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-holo-cyan to-holo-green transition-all"
                          style={{ width: `${test.progress}%` }}
                        />
                      </div>
                    )}
                    {test.status === 'completed' && (
                      <div className="flex items-center text-holo-green text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </div>
                    )}
                    {test.status === 'error' && (
                      <div className="flex items-center text-holo-red text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Error
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Input Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Scan Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contacts (Names, Emails, Phones)
              </label>
              <textarea
                value={inputData.contacts}
                onChange={(e) => setInputData(prev => ({ ...prev, contacts: e.target.value }))}
                className="w-full glass-input min-h-[100px]"
                placeholder="John Doe, john@example.com, +1234567890"
                disabled={isScanning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chat Messages
              </label>
              <textarea
                value={inputData.chatContent}
                onChange={(e) => setInputData(prev => ({ ...prev, chatContent: e.target.value }))}
                className="w-full glass-input min-h-[100px]"
                placeholder="Paste suspicious chat messages here..."
                disabled={isScanning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stock/Crypto Ticker
              </label>
              <input
                type="text"
                value={inputData.ticker}
                onChange={(e) => setInputData(prev => ({ ...prev, ticker: e.target.value }))}
                className="w-full glass-input"
                placeholder="BTC, AAPL, etc."
                disabled={isScanning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Information
              </label>
              <input
                type="text"
                value={inputData.additionalInfo}
                onChange={(e) => setInputData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                className="w-full glass-input"
                placeholder="Any other relevant details..."
                disabled={isScanning}
              />
            </div>
          </div>
        </motion.div>

        {/* Scan Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <button
            onClick={runComprehensiveScan}
            disabled={isScanning || scanTests.filter(t => t.enabled).length === 0}
            className="holo-button text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <div className="holo-spinner w-5 h-5 mr-2 inline-block" />
                Scanning... {Math.round(overallProgress)}%
              </>
            ) : (
              <>
                Launch Comprehensive Scan
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Progress Indicator */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Overall Progress</span>
              <span className="text-holo-cyan font-semibold">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-holo-cyan via-holo-green to-holo-amber transition-all animate-pulse"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Results */}
        {scanComplete && overallRiskScore !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 text-white">Scan Complete</h2>
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${getRiskLevel(overallRiskScore).bg}`}>
                <span className={`text-lg font-semibold ${getRiskLevel(overallRiskScore).color}`}>
                  {getRiskLevel(overallRiskScore).text}
                </span>
              </div>
              <p className="text-3xl font-bold mt-4 holo-text">
                Risk Score: {overallRiskScore}/100
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scanTests
                .filter(test => test.enabled && test.result)
                .map((test) => (
                  <div key={test.id} className="p-4 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <Image src={test.icon} alt={test.name} width={24} height={24} />
                      <h3 className="font-semibold text-white">{test.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      Risk Score: <span className="text-holo-cyan font-semibold">{test.result.riskScore}/100</span>
                    </p>
                  </div>
                ))}
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button className="glass-card px-6 py-2 text-holo-cyan border border-holo-cyan hover:bg-holo-cyan/10 transition-all flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <button 
                onClick={() => {
                  setScanComplete(false);
                  setOverallRiskScore(null);
                  setScanTests(prev => prev.map(test => ({
                    ...test,
                    status: 'idle',
                    progress: 0,
                    result: undefined
                  })));
                }}
                className="glass-card px-6 py-2 text-gray-400 border border-gray-600 hover:bg-gray-800/50 transition-all"
              >
                New Scan
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}