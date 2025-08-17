'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  LineChart,
  Activity,
  DollarSign
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';
import Link from 'next/link';

export default function TradingAnalysisPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  
  const [inputData, setInputData] = useState({
    ticker: '',
    assetType: 'stock' as 'stock' | 'crypto',
    timeframe: '1M' as '1W' | '2W' | '1M' | '3M'
  });

  const handleScan = async () => {
    if (!inputData.ticker.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please provide a ticker symbol to analyze.',
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
        setProgress(prev => Math.min(prev + 10, 90));
      }, 400);

      const result = await detectionService.analyzeTradingActivity({
        ticker: inputData.ticker.toUpperCase(),
        assetType: inputData.assetType,
        timeframe: inputData.timeframe
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setScanResult(result);
      setScanComplete(true);
      
      toast({
        title: 'Analysis Complete',
        description: 'Trading activity analysis completed successfully.',
      });
    } catch (error) {
      console.error('Trading analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze trading activity. Please try again.',
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
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-holo-gray/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-holo-gray/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
              src="/icons/trading-activity.svg"
              alt="Trading Analysis"
              width={64}
              height={64}
              className="drop-shadow-lg"
            />
            <div className="absolute inset-0 rounded-full bg-holo-gray/20 blur-xl animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="holo-text">Trading Activity Analysis</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Identify irregular trading patterns, pump-and-dump schemes, and market manipulation
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
        <h2 className="text-xl font-bold text-white mb-6">Enter Asset Information</h2>
        <p className="text-gray-400 mb-6">
          Provide the ticker symbol and select the asset type for analysis
        </p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2 text-holo-gray" />
                Ticker Symbol
              </label>
              <input
                id="ticker"
                type="text"
                placeholder="e.g., AAPL, BTC, ETH"
                value={inputData.ticker}
                onChange={(e) => setInputData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                disabled={isScanning}
                className="w-full glass-input"
              />
            </div>
            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-300 mb-2">
                <Activity className="w-4 h-4 inline mr-2 text-holo-gray" />
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
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-300 mb-2">
              <LineChart className="w-4 h-4 inline mr-2 text-holo-gray" />
              Analysis Timeframe
            </label>
            <select
              id="timeframe"
              value={inputData.timeframe}
              onChange={(e) => setInputData(prev => ({ ...prev, timeframe: e.target.value as '1W' | '2W' | '1M' | '3M' }))}
              disabled={isScanning}
              className="w-full glass-input"
            >
              <option value="1W">1 Week</option>
              <option value="2W">2 Weeks</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-holo-amber/10 border border-holo-amber/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-holo-amber flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-holo-amber mb-1">Note</div>
                <div className="text-sm text-gray-400">
                  This analysis looks for unusual trading patterns, sudden volume spikes, and potential manipulation indicators.
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
                Analyzing Trading Activity...
              </>
            ) : (
              <>
                <LineChart className="mr-2 h-5 w-5" />
                Analyze Trading Patterns
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
              <span className="text-gray-300">Analysis Progress</span>
              <span className="text-holo-gray">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-holo-gray to-gray-400 transition-all animate-pulse"
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
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Trading Analysis Results</h2>
              <span className={`px-4 py-2 rounded-full text-white text-sm font-medium ${getRiskBadge(scanResult.riskScore || 0).color}`}>
                {getRiskBadge(scanResult.riskScore || 0).text}
              </span>
            </div>
            <div className="space-y-6">
              {/* Market Data */}
              {scanResult.marketData && (
                <div>
                  <h3 className="font-semibold mb-3">Market Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">Current Price</div>
                      <div className="font-semibold text-white">${scanResult.marketData.currentPrice}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">24h Change</div>
                      <div className={`font-semibold ${scanResult.marketData.change24h >= 0 ? 'text-holo-green' : 'text-holo-red'}`}>
                        {scanResult.marketData.change24h >= 0 ? '+' : ''}{scanResult.marketData.change24h}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">Volume</div>
                      <div className="font-semibold text-white">${(scanResult.marketData.volume / 1000000).toFixed(2)}M</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">Market Cap</div>
                      <div className="font-semibold text-white">${(scanResult.marketData.marketCap / 1000000000).toFixed(2)}B</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">Volatility</div>
                      <div className="font-semibold text-white">{scanResult.marketData.volatility}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                      <div className="text-xs text-gray-400">RSI</div>
                      <div className="font-semibold text-white">{scanResult.marketData.rsi}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manipulation Indicators */}
              {scanResult.manipulationIndicators && scanResult.manipulationIndicators.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Manipulation Indicators Detected
                  </h3>
                  <div className="space-y-3">
                    {scanResult.manipulationIndicators.map((indicator: any, index: number) => (
                      <div key={index} className="p-4 rounded-xl bg-gray-800/30 border border-holo-amber/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-holo-amber">{indicator.type}</div>
                            <div className="text-sm text-gray-400 mt-1">{indicator.description}</div>
                          </div>
                          <div className="text-xs bg-holo-amber/20 text-holo-amber px-3 py-1 rounded-full">
                            {indicator.severity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volume Analysis */}
              {scanResult.volumeAnalysis && (
                <div>
                  <h3 className="font-semibold mb-3">Volume Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Daily Volume</span>
                      <span className="font-medium">{(scanResult.volumeAnalysis.averageVolume / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Volume Spike Detected</span>
                      <span className="font-medium">{scanResult.volumeAnalysis.spikeDetected ? 'Yes' : 'No'}</span>
                    </div>
                    {scanResult.volumeAnalysis.unusualActivity && (
                      <div className="mt-2 p-3 rounded-xl bg-holo-red/10 border border-holo-red/30">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-holo-red flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-holo-red mb-1">Unusual Activity</div>
                            <div className="text-sm text-gray-400">
                              {scanResult.volumeAnalysis.unusualActivity}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Pattern Analysis */}
              {scanResult.pricePatterns && scanResult.pricePatterns.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Price Patterns Detected</h3>
                  <div className="space-y-2">
                    {scanResult.pricePatterns.map((pattern: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{pattern.name}</span>
                        <span className="ml-auto text-xs text-gray-500">{pattern.confidence}% confidence</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News Correlation */}
              {scanResult.newsCorrelation && (
                <div>
                  <h3 className="font-semibold mb-3">News Correlation</h3>
                  <div className="p-4 rounded-xl bg-gray-800/30 border border-holo-cyan/30">
                    <div className="text-sm text-gray-300">{scanResult.newsCorrelation.summary}</div>
                    {scanResult.newsCorrelation.suspiciousActivity && (
                      <div className="mt-2 text-sm text-holo-red">
                        ⚠️ {scanResult.newsCorrelation.suspiciousActivity}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700">
                <h4 className="font-semibold text-white mb-3">Summary</h4>
                <p className="text-sm text-gray-300">
                  Risk Score: <span className="text-holo-gray font-bold">{scanResult.riskScore || 0}/100</span>
                </p>
                {scanResult.recommendation && (
                  <p className="text-sm text-gray-400 mt-3">{scanResult.recommendation}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}