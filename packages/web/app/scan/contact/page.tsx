'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  UserCheck,
  Phone,
  Mail,
  Building,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectionService, type ContactVerificationResult } from '@/services/detection.service';
import Link from 'next/link';
import Image from 'next/image';

type ContactInsightStatus = 'safe' | 'warning' | 'danger';

interface ContactInsightCard {
  title: string;
  description: string;
  status: ContactInsightStatus;
}

const buildContactInsights = (result: ContactVerificationResult): ContactInsightCard[] => {
  const cards: ContactInsightCard[] = [];

  result.checks.forEach((check) => {
    if (!check.result) {
      if (check.error) {
        cards.push({
          title: `${check.type === 'email' ? 'Email' : 'Phone'}: ${check.value}`,
          description: check.error,
          status: 'warning',
        });
      }
      return;
    }

    const score = check.result.riskScore ?? 0;
    const status: ContactInsightStatus = score >= 70 || check.result.metadata?.isScammer
      ? 'danger'
      : score >= 40
        ? 'warning'
        : 'safe';

    const sources = Array.isArray(check.result.metadata?.verificationSources)
      ? `Verified via ${check.result.metadata?.verificationSources.join(', ')}`
      : undefined;

    const flags = (check.result.flags || []).slice(0, 3);
    const flagText = flags.length ? `Flags: ${flags.join(', ')}` : undefined;

    cards.push({
      title: `${check.type === 'email' ? 'Email' : 'Phone'}: ${check.value}`,
      description:
        check.result.summary ||
        [
          sources,
          flagText,
        ]
          .filter(Boolean)
          .join(' • ') ||
        'No significant findings reported.',
      status,
    });
  });

  (result.keyFindings || []).forEach((finding) => {
    cards.push({
      title: 'Insight',
      description: finding,
      status: result.riskLevel === 'HIGH' ? 'danger' : result.riskLevel === 'MEDIUM' ? 'warning' : 'safe',
    });
  });

  return cards;
};

export default function ContactVerificationPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<ContactVerificationResult | null>(null);
  const [insights, setInsights] = useState<ContactInsightCard[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [inputData, setInputData] = useState({
    name: '',
    phone: '',
    email: '',
    workplace: '',
    additionalContacts: ''
  });

  const handleScan = async () => {
    if (!inputData.name && !inputData.phone && !inputData.email) {
      toast({
        title: 'Input Required',
        description: 'Please provide at least one contact detail to verify.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setProgress(0);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Parse contacts
      const contacts = [];
      if (inputData.name) contacts.push({ name: inputData.name });
      if (inputData.phone) contacts.push({ phone: inputData.phone });
      if (inputData.email) contacts.push({ email: inputData.email });
      if (inputData.workplace) contacts.push({ workplace: inputData.workplace });

      // Call detection service
      const result = await detectionService.verifyContacts({ contacts });

      setScanResult(result);
      setInsights(buildContactInsights(result));
      setScanComplete(true);
      
      toast({
        title: 'Scan Complete',
        description: 'Contact verification has been completed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'An error occurred during the verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { text: 'High Risk', color: 'text-holo-red', bg: 'bg-holo-red/20', gradient: 'from-holo-red to-red-600' };
    if (score >= 40) return { text: 'Medium Risk', color: 'text-holo-amber', bg: 'bg-holo-amber/20', gradient: 'from-holo-amber to-holo-amber-light' };
    return { text: 'Low Risk', color: 'text-holo-green', bg: 'bg-holo-green/20', gradient: 'from-holo-green to-holo-green-light' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
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
                src="/icons/contact-verification.svg"
                alt="Contact Verification"
                width={64}
                height={64}
                className="drop-shadow-lg"
              />
              <div className="absolute inset-0 rounded-full bg-holo-cyan/20 blur-xl animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="holo-text">Contact Verification</span>
              </h1>
              <p className="text-gray-400 mt-2">
                Verify phone numbers, emails, and names against scammer databases
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
          <h2 className="text-xl font-bold text-white mb-6">Enter Contact Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <UserCheck className="w-4 h-4 inline mr-2 text-holo-cyan" />
                Full Name
              </label>
              <input
                type="text"
                value={inputData.name}
                onChange={(e) => setInputData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full glass-input"
                placeholder="John Doe"
                disabled={isScanning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2 text-holo-cyan" />
                Phone Number
              </label>
              <input
                type="tel"
                value={inputData.phone}
                onChange={(e) => setInputData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full glass-input"
                placeholder="+1 234 567 8900"
                disabled={isScanning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2 text-holo-cyan" />
                Email Address
              </label>
              <input
                type="email"
                value={inputData.email}
                onChange={(e) => setInputData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full glass-input"
                placeholder="john@example.com"
                disabled={isScanning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Building className="w-4 h-4 inline mr-2 text-holo-cyan" />
                Workplace
              </label>
              <input
                type="text"
                value={inputData.workplace}
                onChange={(e) => setInputData(prev => ({ ...prev, workplace: e.target.value }))}
                className="w-full glass-input"
                placeholder="Company Name"
                disabled={isScanning}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2 text-holo-cyan" />
              Additional Contacts (one per line)
            </label>
            <textarea
              value={inputData.additionalContacts}
              onChange={(e) => setInputData(prev => ({ ...prev, additionalContacts: e.target.value }))}
              className="w-full glass-input min-h-[100px]"
              placeholder="Enter additional names, phones, or emails..."
              disabled={isScanning}
            />
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="holo-button text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <div className="holo-spinner w-5 h-5 mr-2 inline-block" />
                  Verifying Contacts...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2 inline-block" />
                  Start Verification
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300">Verification Progress</span>
              <span className="text-holo-cyan font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-holo-cyan to-holo-cyan-light transition-all animate-pulse"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 mr-2 text-holo-green" />
                Checking international databases...
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 mr-2 text-holo-green" />
                Verifying social media profiles...
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <div className="holo-spinner w-4 h-4 mr-2" />
                Analyzing behavioral patterns...
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {scanComplete && scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Risk Score */}
            <div className="glass-card p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Verification Complete</h2>
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#risk-gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(scanResult?.riskScore || 25) * 5.5} 550`}
                    className="filter drop-shadow-lg"
                  />
                  <defs>
                    <linearGradient id="risk-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2E8B57" />
                      <stop offset="50%" stopColor="#1FB8CD" />
                      <stop offset="100%" stopColor="#DB4545" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-5xl font-bold holo-text">{scanResult?.riskScore || 25}%</div>
                    <div className={`text-sm mt-2 ${getRiskLevel(scanResult?.riskScore || 25).color}`}>
                      {getRiskLevel(scanResult?.riskScore || 25).text}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 max-w-2xl mx-auto">
                {scanResult?.summary || 'Contact verification completed. No immediate red flags detected, but always remain vigilant.'}
              </p>
            </div>

            {/* Detailed Results */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Verification Details</h3>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((detail, index) => (
                    <div
                      key={`${detail.title}-${index}`}
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50"
                    >
                      {detail.status === 'safe' ? (
                        <CheckCircle2 className="w-5 h-5 text-holo-green mt-0.5" />
                      ) : detail.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-holo-amber mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-holo-red mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{detail.title}</p>
                        <p className="text-gray-400 text-sm mt-1">{detail.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <CheckCircle2 className="w-5 h-5 text-holo-green mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-medium">No Known Scammer Database Matches</p>
                        <p className="text-gray-400 text-sm mt-1">Contact not found in any known scammer databases</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <AlertTriangle className="w-5 h-5 text-holo-amber mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Limited Online Presence</p>
                        <p className="text-gray-400 text-sm mt-1">Could not verify all provided information online</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setScanComplete(false);
                  setScanResult(null);
                  setInputData({
                    name: '',
                    phone: '',
                    email: '',
                    workplace: '',
                    additionalContacts: ''
                  });
                }}
                className="glass-card px-6 py-3 text-gray-300 border border-gray-700 hover:border-holo-cyan/50 hover:text-white transition-all"
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
