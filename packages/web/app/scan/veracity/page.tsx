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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/scan">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Scans
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stock/Crypto Veracity Check</h1>
        <p className="text-muted-foreground">
          Verify existence and legitimacy of stocks and cryptocurrencies against regulatory and law enforcement databases
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Asset Details</CardTitle>
          <CardDescription>
            Provide the ticker symbol and asset type to verify its legitimacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker Symbol</Label>
              <Input
                id="ticker"
                placeholder="e.g., AAPL, BTC, TSLA"
                value={inputData.ticker}
                onChange={(e) => setInputData(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
                disabled={isScanning}
              />
            </div>
            <div>
              <Label htmlFor="assetType">Asset Type</Label>
              <Select
                value={inputData.assetType}
                onValueChange={(value: 'stock' | 'crypto') => setInputData(prev => ({ ...prev, assetType: value }))}
                disabled={isScanning}
              >
                <SelectTrigger id="assetType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="exchange">Exchange Name (Optional)</Label>
            <Input
              id="exchange"
              placeholder="e.g., NYSE, NASDAQ, Binance"
              value={inputData.exchangeName}
              onChange={(e) => setInputData(prev => ({ ...prev, exchangeName: e.target.value }))}
              disabled={isScanning}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Specify the exchange if you want to verify listing on a specific platform
            </p>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Verification Scope</AlertTitle>
            <AlertDescription>
              We check SEC EDGAR, FINRA, CoinGecko, law enforcement databases, and regulatory compliance records.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleScan} 
            disabled={isScanning}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Asset...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Verify Asset Legitimacy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isScanning && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {scanComplete && scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Verification Results
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getRiskBadge(scanResult.riskScore || 0).color}`}>
                  {getRiskBadge(scanResult.riskScore || 0).text}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">SEC Registration</span>
                          <span className={`text-sm ${scanResult.regulatoryCompliance.sec.registered ? 'text-green-600' : 'text-gray-400'}`}>
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
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">FINRA Status</span>
                          <span className={`text-sm ${scanResult.regulatoryCompliance.finra.valid ? 'text-green-600' : 'text-gray-400'}`}>
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
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {exchange}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Law Enforcement Alerts */}
              {scanResult.lawEnforcementAlerts && scanResult.lawEnforcementAlerts.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Law Enforcement Alerts</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {scanResult.lawEnforcementAlerts.map((alert: any, index: number) => (
                        <li key={index} className="text-sm">
                          {alert.source}: {alert.description}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Smart Contract Audit (for crypto) */}
              {scanResult.smartContractAudit && (
                <div>
                  <h3 className="font-semibold mb-3">Smart Contract Audit</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Audit Status</span>
                      <span className={`text-sm font-medium ${scanResult.smartContractAudit.audited ? 'text-green-600' : 'text-yellow-600'}`}>
                        {scanResult.smartContractAudit.audited ? 'Audited' : 'Not Audited'}
                      </span>
                    </div>
                    {scanResult.smartContractAudit.auditor && (
                      <div className="text-xs text-gray-600">
                        Auditor: {scanResult.smartContractAudit.auditor}
                      </div>
                    )}
                    {scanResult.smartContractAudit.issues && (
                      <div className="text-xs text-red-600 mt-1">
                        Issues Found: {scanResult.smartContractAudit.issues}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">
                  Risk Score: {scanResult.riskScore || 0}/100
                </p>
                {scanResult.recommendation && (
                  <p className="text-sm mt-2">{scanResult.recommendation}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}