'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  Search
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { detectionService, type VeracityCheckResult } from '@/services/detection.service';
import Link from 'next/link';

export default function VeracityCheckPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<VeracityCheckResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  const [inputData, setInputData] = useState({
    ticker: '',
    assetType: 'stock' as 'stock' | 'crypto',
    exchangeName: ''
  });

  const handleScan = async () => {
    if (!inputData.ticker.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please provide a ticker symbol to verify.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setScanResult(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const result = await detectionService.checkVeracity({
        ticker: inputData.ticker.toUpperCase(),
        assetType: inputData.assetType,
        exchangeName: inputData.exchangeName || undefined
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setScanResult(result);
      setScanComplete(true);
      
      toast({
        title: 'Verification Complete',
        description: 'Asset veracity check completed successfully.',
      });
    } catch (error) {
      console.error('Veracity check failed:', error);
      toast({
        title: 'Verification Failed',
        description: 'Failed to verify asset. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { color: 'bg-red-500', text: 'High Risk' };
    if (score >= 40) return { color: 'bg-yellow-500', text: 'Medium Risk' };
    return { color: 'bg-green-500', text: 'Low Risk' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-holo-amber/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-holo-amber/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/scan" className="inline-flex items-center text-gray-400 hover:text-holo-cyan transition-colors mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Tests
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Image
              src="/icons/veracity-check.svg"
              alt="Veracity Check"
              width={64}
              height={64}
              className="drop-shadow-lg"
            />
            <div className="absolute inset-0 rounded-full bg-holo-amber/20 blur-xl animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="holo-text">Stock/Crypto Veracity Check</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Verify existence and legitimacy of stocks and cryptocurrencies against regulatory and law enforcement databases
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 mb-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">Enter Asset Details</h2>
        <p className="text-gray-400 mb-6">
          Provide the ticker symbol and asset type to verify its legitimacy
        </p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-300 mb-2">
                <Shield className="w-4 h-4 inline mr-2 text-holo-amber" />
                Ticker Symbol
              </label>
              <input
                id="ticker"
                type="text"
                placeholder="e.g., AAPL, BTC, TSLA"
                value={inputData.ticker}
                onChange={(e) => setInputData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                disabled={isScanning}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-300 mb-2">
                <Building2 className="w-4 h-4 inline mr-2 text-holo-amber" />
                Asset Type
              </label>
              <select
                id="assetType"
                value={inputData.assetType}
                onChange={(e) => setInputData(prev => ({ ...prev, assetType: e.target.value as 'stock' | 'crypto' }))}
                disabled={isScanning}
                className="w-full glass-input"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="exchange" className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-2 text-holo-amber" />
              Exchange Name (Optional)
            </label>
            <input
              id="exchange"
              type="text"
              placeholder="e.g., NYSE, NASDAQ, Binance"
              value={inputData.exchangeName}
              onChange={(e) => setInputData(prev => ({ ...prev, exchangeName: e.target.value }))}
              disabled={isScanning}
              className="w-full glass-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Specify the exchange if you want to verify listing on a specific platform
            </p>
          </div>

          <div className="p-4 rounded-xl bg-holo-cyan/10 border border-holo-cyan/30">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-holo-cyan flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-holo-cyan mb-1">Verification Scope</div>
                <div className="text-sm text-gray-400">
                  We check SEC EDGAR, FINRA, CoinGecko, law enforcement databases, and regulatory compliance records.
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleScan} 
            disabled={isScanning || !inputData.ticker.trim()}
            className="w-full holo-button text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <div className="holo-spinner w-5 h-5 mr-2 inline-block" />
                Verifying Asset...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Verify Asset Legitimacy
              </>
            )}
          </button>
        </div>
      </motion.div>

      {isScanning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Verification Progress</span>
              <span className="text-holo-amber">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-holo-amber to-holo-amber-light transition-all animate-pulse"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {scanComplete && scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-card p-8 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Verification Results</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Status: {scanResult.verificationStatus || (scanResult.isVerified ? 'VERIFIED' : 'UNVERIFIED')}
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full text-white text-sm font-medium ${getRiskBadge(scanResult.riskScore).color}`}>
                {getRiskBadge(scanResult.riskScore).text}
              </span>
            </div>
            <div className="mt-6 p-4 rounded-xl bg-gray-800/30 border border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Summary</div>
              <p className="text-gray-200 leading-relaxed">{scanResult.summary}</p>
              <p className="text-xs text-gray-500 mt-3">
                Confidence score: {Math.round(scanResult.confidence ?? 0)}%
              </p>
            </div>
          </div>

          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-holo-amber" />
              Key Findings
            </h3>
            <div className="space-y-3">
              {(scanResult.keyFindings && scanResult.keyFindings.length > 0)
                ? scanResult.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <div className="h-2 w-2 bg-holo-amber rounded-full mt-1.5 flex-shrink-0" />
                      <div className="text-sm text-gray-300">{finding}</div>
                    </div>
                  ))
                : (
                    <p className="text-sm text-gray-400">
                      No adverse findings reported from the verification checks.
                    </p>
                  )}
            </div>
          </div>

          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-holo-green" />
              Recommended Actions
            </h3>
            <ul className="space-y-2">
              {(scanResult.recommendations && scanResult.recommendations.length > 0)
                ? scanResult.recommendations.map((recommendation, index) => (
                    <li key={`${recommendation}-${index}`} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-holo-green mt-0.5" />
                      <span>{recommendation}</span>
                    </li>
                  ))
                : (
                    <li className="text-sm text-gray-400">
                      Continue monitoring for regulatory updates and maintain standard due diligence.
                    </li>
                  )}
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setScanComplete(false);
                setScanResult(null);
                setInputData(prev => ({ ...prev, ticker: '' }));
              }}
              className="glass-card px-6 py-3 text-gray-300 border border-gray-700 hover:border-holo-amber/50 hover:text-white transition-all"
            >
              New Verification
            </button>
            <Link href="/scan">
              <button className="holo-button px-6 py-3">
                Run All Tests
                <Zap className="w-4 h-4 ml-2 inline" />
              </button>
            </Link>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
