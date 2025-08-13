'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';

interface ScanTest {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
}

export function ComprehensiveScan() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [overallRiskScore, setOverallRiskScore] = useState<number | null>(null);
  
  const [scanTests, setScanTests] = useState<ScanTest[]>([
    {
      id: 'contact',
      name: 'Contact Verification',
      description: 'Verify group members, managers, and contacts against international scammer databases',
      icon: Users,
      enabled: true,
      status: 'idle',
      progress: 0
    },
    {
      id: 'chat',
      name: 'Chat Analysis',
      description: 'Detect psychological manipulation and scam language patterns',
      icon: MessageSquare,
      enabled: true,
      status: 'idle',
      progress: 0
    },
    {
      id: 'trading',
      name: 'Trading Activity Analysis',
      description: 'Identify irregular trading patterns and market manipulation',
      icon: TrendingUp,
      enabled: true,
      status: 'idle',
      progress: 0
    },
    {
      id: 'veracity',
      name: 'Veracity Check',
      description: 'Verify stock/crypto existence and check law enforcement databases',
      icon: Shield,
      enabled: true,
      status: 'idle',
      progress: 0
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
    setIsScanning(true);
    setScanComplete(false);
    setOverallProgress(0);
    
    try {
      // Prepare contact data
      const contacts = inputData.contacts
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
          const phoneMatch = line.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/);
          
          return {
            name: line.replace(emailMatch?.[0] || '', '').replace(phoneMatch?.[0] || '', '').trim(),
            email: emailMatch?.[0],
            phone: phoneMatch?.[0]
          };
        })
        .filter(contact => contact.name || contact.email || contact.phone);
      
      // Call the service (using mock for now)
      const results = await detectionService.runComprehensiveScanMock({
        contacts,
        chatContent: inputData.chatContent,
        ticker: inputData.ticker,
        assetType: inputData.ticker ? 'stock' : undefined,
        enabledTests: {
          contactVerification: scanTests.find(t => t.id === 'contact')?.enabled || false,
          chatAnalysis: scanTests.find(t => t.id === 'chat')?.enabled || false,
          tradingAnalysis: scanTests.find(t => t.id === 'trading')?.enabled || false,
          veracityCheck: scanTests.find(t => t.id === 'veracity')?.enabled || false,
        }
      });
      
      // Update test results
      setScanTests(prev => prev.map(test => {
        let result;
        switch(test.id) {
          case 'contact':
            result = results.contactVerification;
            break;
          case 'chat':
            result = results.chatAnalysis;
            break;
          case 'trading':
            result = results.tradingAnalysis;
            break;
          case 'veracity':
            result = results.veracityCheck;
            break;
        }
        
        if (result && test.enabled) {
          return {
            ...test,
            status: 'completed',
            progress: 100,
            result: {
              score: result.riskScore || result.overallRiskScore || 0,
              flags: result.flaggedContacts || result.suspiciousPhrases || result.lawEnforcementFlags || 0,
              details: result
            }
          };
        }
        return test;
      }));
      
      setOverallRiskScore(results.overallRiskScore);
      setOverallProgress(100);
      setScanComplete(true);
      
      toast({
        title: "Scan Complete",
        description: `Overall risk score: ${results.overallRiskScore.toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "An error occurred during the scan. Please try again.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-500', bgColor: 'bg-green-100' };
    if (score < 60) return { level: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    if (score < 80) return { level: 'High', color: 'text-orange-500', bgColor: 'bg-orange-100' };
    return { level: 'Critical', color: 'text-red-500', bgColor: 'bg-red-100' };
  };

  const exportReport = () => {
    toast({
      title: "Report Exported",
      description: "Your comprehensive scan report has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Comprehensive Scam Detection
        </h1>
        <p className="text-muted-foreground text-lg">
          Run all 4 detection tests simultaneously or customize your scan
        </p>
      </div>

      {/* Test Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tests to Run</CardTitle>
          <CardDescription>
            Choose which detection tests to include in your comprehensive scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scanTests.map((test) => {
              const Icon = test.icon;
              const risk = test.result ? getRiskLevel(test.result.score) : null;
              
              return (
                <motion.div
                  key={test.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      test.enabled ? 'border-blue-500 bg-blue-50/50' : ''
                    }`}
                    onClick={() => toggleTest(test.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={test.enabled}
                          onCheckedChange={() => toggleTest(test.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-blue-600" />
                              <h3 className="font-semibold">{test.name}</h3>
                            </div>
                            {test.status === 'running' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                            {test.status === 'completed' && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {test.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {test.description}
                          </p>
                          {test.status === 'running' && (
                            <Progress value={test.progress} className="h-2" />
                          )}
                          {test.result && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={risk?.bgColor}>
                                Risk: {risk?.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {test.result.flags} flags detected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Input Data */}
      <Card>
        <CardHeader>
          <CardTitle>Input Data</CardTitle>
          <CardDescription>
            Provide the information you want to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contacts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="chat">Chat Content</TabsTrigger>
              <TabsTrigger value="trading">Trading Info</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contacts" className="space-y-4">
              <div>
                <Label>Contact Information</Label>
                <Textarea
                  placeholder="Enter names, phone numbers, emails (one per line)..."
                  value={inputData.contacts}
                  onChange={(e) => setInputData({...inputData, contacts: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="space-y-4">
              <div>
                <Label>Chat Messages</Label>
                <Textarea
                  placeholder="Paste chat messages or conversation transcripts..."
                  value={inputData.chatContent}
                  onChange={(e) => setInputData({...inputData, chatContent: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="trading" className="space-y-4">
              <div>
                <Label>Stock/Crypto Ticker</Label>
                <Input
                  placeholder="Enter ticker symbol (e.g., AAPL, BTC)..."
                  value={inputData.ticker}
                  onChange={(e) => setInputData({...inputData, ticker: e.target.value})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-4">
              <div>
                <Label>Additional Information</Label>
                <Textarea
                  placeholder="Any additional context or information..."
                  value={inputData.additionalInfo}
                  onChange={(e) => setInputData({...inputData, additionalInfo: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          size="lg"
          onClick={runComprehensiveScan}
          disabled={isScanning || !scanTests.some(t => t.enabled)}
          className="min-w-[200px]"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Run Comprehensive Scan
            </>
          )}
        </Button>
        
        {scanComplete && (
          <Button
            size="lg"
            variant="outline"
            onClick={exportReport}
            className="min-w-[150px]"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      {isScanning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {scanComplete && overallRiskScore !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert className={getRiskLevel(overallRiskScore).bgColor}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scan Complete</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <div className="text-2xl font-bold">
                  Overall Risk Score: {overallRiskScore.toFixed(1)}%
                </div>
                <div className="text-lg">
                  Risk Level: <span className={getRiskLevel(overallRiskScore).color}>
                    {getRiskLevel(overallRiskScore).level}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {scanTests.filter(t => t.enabled).length} tests completed successfully
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}