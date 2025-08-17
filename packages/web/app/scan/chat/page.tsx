'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Brain,
  Shield,
  Zap,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';
import Link from 'next/link';
import Image from 'next/image';

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

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { text: 'High Risk', color: 'text-holo-red', bg: 'bg-holo-red/20' };
    if (score >= 40) return { text: 'Medium Risk', color: 'text-holo-amber', bg: 'bg-holo-amber/20' };
    return { text: 'Low Risk', color: 'text-holo-green', bg: 'bg-holo-green/20' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-holo-green/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-holo-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/scan" className="inline-flex items-center text-gray-400 hover:text-holo-cyan transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Tests
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src="/icons/chat-analysis.svg"
                alt="Chat Analysis"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-holo-green/20 blur-xl animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="holo-text">Chat Language Analysis</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Detect psychological manipulation patterns and scam language using advanced AI
              </p>
            </div>
          </div>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Upload Chat Conversation</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2 text-holo-green" />
                Chat Platform
              </label>
              <select
                value={inputData.platform}
                onChange={(e) => setInputData(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full glass-input"
                disabled={isScanning}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook Messenger</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2 text-holo-green" />
                Chat Messages
              </label>
              <textarea
                placeholder="Paste your chat messages here. Each message should be on a new line.

Example:
John: Hey, I have an amazing investment opportunity for you
You: What kind of investment?
John: It's a guaranteed return of 200% in just 30 days..."
                value={inputData.chatContent}
                onChange={(e) => setInputData(prev => ({ ...prev, chatContent: e.target.value }))}
                disabled={isScanning}
                rows={12}
                className="w-full glass-input font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Include the entire conversation for better analysis accuracy
              </p>
            </div>

            <button 
              onClick={handleScan} 
              disabled={isScanning || !inputData.chatContent.trim()}
              className="w-full holo-button text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <div className="holo-spinner w-5 h-5 mr-2 inline-block" />
                  Analyzing Chat...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2 inline-block" />
                  Analyze Conversation
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Progress */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 mb-6"
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Analysis Progress</span>
                <span className="text-holo-green">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-holo-green to-holo-green-light transition-all animate-pulse"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {scanComplete && scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Risk Score */}
            <div className="glass-card p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#chat-gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(scanResult.overallRiskScore || 35) * 5.5} 550`}
                    className="filter drop-shadow-lg"
                  />
                  <defs>
                    <linearGradient id="chat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2E8B57" />
                      <stop offset="50%" stopColor="#3FE0A0" />
                      <stop offset="100%" stopColor="#DB4545" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-5xl font-bold holo-text">{scanResult.overallRiskScore || 35}%</div>
                    <div className={`text-sm mt-2 ${getRiskLevel(scanResult.overallRiskScore || 35).color}`}>
                      {getRiskLevel(scanResult.overallRiskScore || 35).text}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manipulation Techniques */}
            {scanResult.manipulationTechniques && scanResult.manipulationTechniques.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-holo-amber" />
                  Manipulation Techniques Detected
                </h3>
                <div className="space-y-3">
                  {scanResult.manipulationTechniques.map((technique: any, index: number) => (
                    <div key={index} className="p-4 rounded-xl bg-gray-800/30 border border-holo-amber/30">
                      <div className="font-medium text-holo-amber">{technique.type}</div>
                      <div className="text-sm text-gray-400 mt-1">{technique.description}</div>
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
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-holo-red" />
                  Scam Indicators
                </h3>
                <div className="space-y-2">
                  {scanResult.scamIndicators.map((indicator: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/30 border border-holo-red/30">
                      <div className="h-2 w-2 bg-holo-red rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white">{indicator.indicator}</div>
                        <div className="text-xs text-gray-500">Confidence: {indicator.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Analysis */}
            {scanResult.emotionalAnalysis && (
              <div className="glass-card p-6">
                <h3 className="font-semibold text-white mb-4">Emotional Analysis</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="text-gray-400 text-sm">Urgency Level</div>
                    <div className="font-medium text-white">{scanResult.emotionalAnalysis.urgencyLevel || 'Normal'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="text-gray-400 text-sm">Fear Tactics</div>
                    <div className="font-medium text-white">{scanResult.emotionalAnalysis.fearTactics ? 'Detected' : 'Not Detected'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="text-gray-400 text-sm">Trust Building</div>
                    <div className="font-medium text-white">{scanResult.emotionalAnalysis.trustBuilding || 'Normal'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-700">
                    <div className="text-gray-400 text-sm">Pressure Tactics</div>
                    <div className="font-medium text-white">{scanResult.emotionalAnalysis.pressureTactics ? 'Present' : 'Absent'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setScanComplete(false);
                  setScanResult(null);
                  setInputData({ chatContent: '', platform: 'whatsapp' });
                }}
                className="glass-card px-6 py-3 text-gray-300 border border-gray-700 hover:border-holo-cyan/50 hover:text-white transition-all"
              >
                New Analysis
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