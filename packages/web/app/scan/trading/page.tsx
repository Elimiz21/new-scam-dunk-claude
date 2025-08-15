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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/scan">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Scans
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Activity Analysis</h1>
        <p className="text-muted-foreground">
          Identify irregular trading patterns, pump-and-dump schemes, and market manipulation
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Asset Information</CardTitle>
          <CardDescription>
            Provide the ticker symbol and select the asset type for analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker Symbol</Label>
              <Input
                id="ticker"
                placeholder="e.g., AAPL, BTC, ETH"
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
            <Label htmlFor="timeframe">Analysis Timeframe</Label>
            <Select
              value={inputData.timeframe}
              onValueChange={(value: '1W' | '2W' | '1M' | '3M') => setInputData(prev => ({ ...prev, timeframe: value }))}
              disabled={isScanning}
            >
              <SelectTrigger id="timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1W">1 Week</SelectItem>
                <SelectItem value="2W">2 Weeks</SelectItem>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              This analysis looks for unusual trading patterns, sudden volume spikes, and potential manipulation indicators.
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
                Analyzing Trading Activity...
              </>
            ) : (
              <>
                <LineChart className="mr-2 h-4 w-4" />
                Analyze Trading Patterns
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
                <span>Analysis Progress</span>
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
                Trading Analysis Results
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getRiskBadge(scanResult.riskScore || 0).color}`}>
                  {getRiskBadge(scanResult.riskScore || 0).text}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Market Data */}
              {scanResult.marketData && (
                <div>
                  <h3 className="font-semibold mb-3">Market Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Current Price</div>
                      <div className="font-semibold">${scanResult.marketData.currentPrice}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">24h Change</div>
                      <div className={`font-semibold ${scanResult.marketData.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {scanResult.marketData.change24h >= 0 ? '+' : ''}{scanResult.marketData.change24h}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Volume</div>
                      <div className="font-semibold">${(scanResult.marketData.volume / 1000000).toFixed(2)}M</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Market Cap</div>
                      <div className="font-semibold">${(scanResult.marketData.marketCap / 1000000000).toFixed(2)}B</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Volatility</div>
                      <div className="font-semibold">{scanResult.marketData.volatility}%</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">RSI</div>
                      <div className="font-semibold">{scanResult.marketData.rsi}</div>
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
                      <div key={index} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{indicator.type}</div>
                            <div className="text-sm text-gray-600 mt-1">{indicator.description}</div>
                          </div>
                          <div className="text-xs bg-yellow-100 px-2 py-1 rounded">
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
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Unusual Activity</AlertTitle>
                        <AlertDescription>
                          {scanResult.volumeAnalysis.unusualActivity}
                        </AlertDescription>
                      </Alert>
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
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm">{scanResult.newsCorrelation.summary}</div>
                    {scanResult.newsCorrelation.suspiciousActivity && (
                      <div className="mt-2 text-xs text-red-600">
                        ⚠️ {scanResult.newsCorrelation.suspiciousActivity}
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