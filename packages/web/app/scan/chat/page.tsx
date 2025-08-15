'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  Upload,
  FileText,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';
import Link from 'next/link';

export default function ChatAnalysisPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  
  const [inputData, setInputData] = useState({
    chatContent: '',
    platform: 'whatsapp'
  });

  const handleScan = async () => {
    if (!inputData.chatContent.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please provide chat messages to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setScanResult(null);
    setProgress(0);

    const messages = inputData.chatContent.split('\n').filter(msg => msg.trim());

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const result = await detectionService.analyzeChat({ 
        messages,
        platform: inputData.platform
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setScanResult(result);
      setScanComplete(true);
      
      toast({
        title: 'Analysis Complete',
        description: 'Chat analysis completed successfully.',
      });
    } catch (error) {
      console.error('Chat analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze chat. Please try again.',
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
        <h1 className="text-3xl font-bold mb-2">Chat Language Analysis</h1>
        <p className="text-muted-foreground">
          Detect psychological manipulation patterns and scam language using advanced AI
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Chat Conversation</CardTitle>
          <CardDescription>
            Paste your chat messages or upload a chat export file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="platform">Chat Platform</Label>
            <Select
              value={inputData.platform}
              onValueChange={(value) => setInputData(prev => ({ ...prev, platform: value }))}
              disabled={isScanning}
            >
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook Messenger</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="chat">Chat Messages</Label>
            <Textarea
              id="chat"
              placeholder="Paste your chat messages here. Each message should be on a new line.

Example:
John: Hey, I have an amazing investment opportunity for you
You: What kind of investment?
John: It's a guaranteed return of 200% in just 30 days..."
              value={inputData.chatContent}
              onChange={(e) => setInputData(prev => ({ ...prev, chatContent: e.target.value }))}
              disabled={isScanning}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Include the entire conversation for better analysis accuracy
            </p>
          </div>

          <Button 
            onClick={handleScan} 
            disabled={isScanning}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Chat...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze Conversation
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
                Analysis Results
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getRiskBadge(scanResult.overallRiskScore || 0).color}`}>
                  {getRiskBadge(scanResult.overallRiskScore || 0).text}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manipulation Techniques */}
              {scanResult.manipulationTechniques && scanResult.manipulationTechniques.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Manipulation Techniques Detected
                  </h3>
                  <div className="space-y-2">
                    {scanResult.manipulationTechniques.map((technique: any, index: number) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-sm">{technique.type}</div>
                        <div className="text-sm text-gray-600 mt-1">{technique.description}</div>
                        {technique.examples && (
                          <div className="mt-2 text-xs text-gray-500 italic">
                            Example: "{technique.examples[0]}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scam Indicators */}
              {scanResult.scamIndicators && scanResult.scamIndicators.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Scam Indicators
                  </h3>
                  <div className="space-y-2">
                    {scanResult.scamIndicators.map((indicator: any, index: number) => (
                      <div key={index} className="flex items-start">
                        <div className="h-2 w-2 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm">{indicator.indicator}</div>
                          <div className="text-xs text-gray-500">Confidence: {indicator.confidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional Analysis */}
              {scanResult.emotionalAnalysis && (
                <div>
                  <h3 className="font-semibold mb-3">Emotional Analysis</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Urgency Level</div>
                      <div className="font-medium">{scanResult.emotionalAnalysis.urgencyLevel || 'Normal'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Fear Tactics</div>
                      <div className="font-medium">{scanResult.emotionalAnalysis.fearTactics ? 'Detected' : 'Not Detected'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Trust Building</div>
                      <div className="font-medium">{scanResult.emotionalAnalysis.trustBuilding || 'Normal'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-gray-600">Pressure Tactics</div>
                      <div className="font-medium">{scanResult.emotionalAnalysis.pressureTactics ? 'Present' : 'Absent'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scam Type Classification */}
              {scanResult.scamType && (
                <div>
                  <h3 className="font-semibold mb-3">Scam Type Classification</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">{scanResult.scamType.type}</div>
                    <div className="text-sm text-blue-700 mt-1">{scanResult.scamType.description}</div>
                    <div className="text-xs text-blue-600 mt-2">Confidence: {scanResult.scamType.confidence}%</div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">
                  Overall Risk Score: {scanResult.overallRiskScore || 0}/100
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