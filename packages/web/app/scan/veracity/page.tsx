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
  Search,
  Building2,
  Globe
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';
import Link from 'next/link';

export default function VeracityCheckPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
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

  const getVerificationStatus = (exists: boolean) => {
    if (exists) {
      return { color: 'text-green-600', icon: CheckCircle2, text: 'Verified' };
    }
    return { color: 'text-red-600', icon: XCircle, text: 'Not Found' };
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
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Verification Results</h2>
              <span className={`px-4 py-2 rounded-full text-white text-sm font-medium ${getRiskBadge(scanResult.riskScore || 0).color}`}>
                {getRiskBadge(scanResult.riskScore || 0).text}
              </span>
            </div>
            <div className="space-y-6">
              {/* Asset Existence */}
              <div>
                <h3 className="font-semibold mb-3">Asset Verification</h3>
                <div className="flex items-center space-x-2">
                  {scanResult.exists ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${scanResult.exists ? 'text-green-600' : 'text-red-600'}`}>
                    {scanResult.exists ? 'Asset Exists and Verified' : 'Asset Not Found or Unverified'}
                  </span>
                </div>
              </div>

              {/* Company/Project Information */}
              {scanResult.companyInfo && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Company/Project Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {scanResult.companyInfo.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{scanResult.companyInfo.name}</span>
                      </div>
                    )}
                    {scanResult.companyInfo.founded && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Founded:</span>
                        <span className="font-medium">{scanResult.companyInfo.founded}</span>
                      </div>
                    )}
                    {scanResult.companyInfo.headquarters && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Headquarters:</span>
                        <span className="font-medium">{scanResult.companyInfo.headquarters}</span>
                      </div>
                    )}
                    {scanResult.companyInfo.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website:</span>
                        <a href={scanResult.companyInfo.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {scanResult.companyInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Regulatory Compliance */}
              {scanResult.regulatoryCompliance && (
                <div>
                  <h3 className="font-semibold mb-3">Regulatory Compliance</h3>
                  <div className="space-y-3">
                    {scanResult.regulatoryCompliance.sec && (
                      <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">SEC Registration</span>
                          <span className={`text-sm ${scanResult.regulatoryCompliance.sec.registered ? 'text-holo-green' : 'text-gray-500'}`}>
                            {scanResult.regulatoryCompliance.sec.registered ? 'Registered' : 'Not Registered'}
                          </span>
                        </div>
                        {scanResult.regulatoryCompliance.sec.filingDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last Filing: {scanResult.regulatoryCompliance.sec.filingDate}
                          </div>
                        )}
                      </div>
                    )}
                    {scanResult.regulatoryCompliance.finra && (
                      <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">FINRA Status</span>
                          <span className={`text-sm ${scanResult.regulatoryCompliance.finra.valid ? 'text-holo-green' : 'text-gray-500'}`}>
                            {scanResult.regulatoryCompliance.finra.valid ? 'Valid' : 'Not Found'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Exchange Listings */}
              {scanResult.exchanges && scanResult.exchanges.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Exchange Listings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.exchanges.map((exchange: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-holo-cyan/20 text-holo-cyan rounded-full text-sm font-medium">
                        {exchange}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Law Enforcement Alerts */}
              {scanResult.lawEnforcementAlerts && scanResult.lawEnforcementAlerts.length > 0 && (
                <div className="p-4 rounded-xl bg-holo-red/10 border border-holo-red/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-holo-red flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-holo-red mb-2">Law Enforcement Alerts</div>
                      <ul className="space-y-1">
                        {scanResult.lawEnforcementAlerts.map((alert: any, index: number) => (
                          <li key={index} className="text-sm text-gray-400">
                            <span className="text-holo-amber">{alert.source}:</span> {alert.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Contract Audit (for crypto) */}
              {scanResult.smartContractAudit && (
                <div>
                  <h3 className="font-semibold mb-3">Smart Contract Audit</h3>
                  <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">Audit Status</span>
                      <span className={`text-sm font-medium ${scanResult.smartContractAudit.audited ? 'text-holo-green' : 'text-holo-amber'}`}>
                        {scanResult.smartContractAudit.audited ? 'Audited' : 'Not Audited'}
                      </span>
                    </div>
                    {scanResult.smartContractAudit.auditor && (
                      <div className="text-xs text-gray-400">
                        Auditor: {scanResult.smartContractAudit.auditor}
                      </div>
                    )}
                    {scanResult.smartContractAudit.issues && (
                      <div className="text-xs text-holo-red mt-1">
                        Issues Found: {scanResult.smartContractAudit.issues}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700">
                <h4 className="font-semibold text-white mb-3">Summary</h4>
                <p className="text-sm text-gray-300">
                  Risk Score: <span className="text-holo-amber font-bold">{scanResult.riskScore || 0}/100</span>
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