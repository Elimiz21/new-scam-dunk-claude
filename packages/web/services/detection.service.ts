import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ContactVerificationRequest {
  contacts: Array<{
    name?: string;
    phone?: string;
    email?: string;
    workplace?: string;
  }>;
}

export interface ChatAnalysisRequest {
  messages: string[];
  platform?: string;
  metadata?: Record<string, any>;
}

export interface TradingAnalysisRequest {
  ticker: string;
  timeframe: '1W' | '2W' | '1M' | '3M';
  assetType: 'stock' | 'crypto';
}

export interface VeracityCheckRequest {
  ticker: string;
  assetType: 'stock' | 'crypto';
  exchangeName?: string;
}

export interface ComprehensiveScanRequest {
  contacts?: ContactVerificationRequest['contacts'];
  chatContent?: string;
  ticker?: string;
  assetType?: 'stock' | 'crypto';
  enabledTests: {
    contactVerification: boolean;
    chatAnalysis: boolean;
    tradingAnalysis: boolean;
    veracityCheck: boolean;
  };
}

class DetectionService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async verifyContacts(data: ContactVerificationRequest) {
    const response = await this.api.post('/api/contact-verification/verify', data);
    return response.data;
  }

  async analyzeChat(data: ChatAnalysisRequest) {
    const response = await this.api.post('/api/chat-analysis/analyze', data);
    return response.data;
  }

  async analyzeTradingActivity(data: TradingAnalysisRequest) {
    const response = await this.api.post('/api/trading-analysis/analyze', data);
    return response.data;
  }

  async checkVeracity(data: VeracityCheckRequest) {
    const response = await this.api.post('/api/veracity-checking/verify', data);
    return response.data;
  }

  async runComprehensiveScan(data: ComprehensiveScanRequest) {
    const tasks = [];
    const results: any = {};

    // Contact Verification
    if (data.enabledTests.contactVerification && data.contacts && data.contacts.length > 0) {
      tasks.push(
        this.verifyContacts({ contacts: data.contacts })
          .then(res => { results.contactVerification = res; })
          .catch(err => { results.contactVerification = { error: err.message }; })
      );
    }

    // Chat Analysis
    if (data.enabledTests.chatAnalysis && data.chatContent) {
      const messages = data.chatContent.split('\n').filter(msg => msg.trim());
      tasks.push(
        this.analyzeChat({ messages })
          .then(res => { results.chatAnalysis = res; })
          .catch(err => { results.chatAnalysis = { error: err.message }; })
      );
    }

    // Trading Analysis
    if (data.enabledTests.tradingAnalysis && data.ticker && data.assetType) {
      tasks.push(
        this.analyzeTradingActivity({ 
          ticker: data.ticker, 
          timeframe: '1M',
          assetType: data.assetType 
        })
          .then(res => { results.tradingAnalysis = res; })
          .catch(err => { results.tradingAnalysis = { error: err.message }; })
      );
    }

    // Veracity Check
    if (data.enabledTests.veracityCheck && data.ticker && data.assetType) {
      tasks.push(
        this.checkVeracity({ 
          ticker: data.ticker,
          assetType: data.assetType 
        })
          .then(res => { results.veracityCheck = res; })
          .catch(err => { results.veracityCheck = { error: err.message }; })
      );
    }

    await Promise.all(tasks);
    
    // Calculate overall risk score
    let totalScore = 0;
    let testCount = 0;
    
    if (results.contactVerification?.riskScore) {
      totalScore += results.contactVerification.riskScore;
      testCount++;
    }
    if (results.chatAnalysis?.overallRiskScore) {
      totalScore += results.chatAnalysis.overallRiskScore;
      testCount++;
    }
    if (results.tradingAnalysis?.riskScore) {
      totalScore += results.tradingAnalysis.riskScore;
      testCount++;
    }
    if (results.veracityCheck?.riskScore) {
      totalScore += results.veracityCheck.riskScore;
      testCount++;
    }
    
    results.overallRiskScore = testCount > 0 ? totalScore / testCount : 0;
    results.timestamp = new Date();
    
    return results;
  }

  // Mock implementation for development
  async runComprehensiveScanMock(data: ComprehensiveScanRequest) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const results: any = {};
    
    if (data.enabledTests.contactVerification) {
      results.contactVerification = {
        riskScore: Math.random() * 100,
        flaggedContacts: Math.floor(Math.random() * 3),
        verifiedContacts: Math.floor(Math.random() * 5),
        details: {
          phones: { verified: 2, flagged: 1 },
          emails: { verified: 3, flagged: 0 },
          names: { verified: 4, flagged: 1 }
        }
      };
    }
    
    if (data.enabledTests.chatAnalysis) {
      results.chatAnalysis = {
        overallRiskScore: Math.random() * 100,
        manipulationTechniques: ['urgency', 'fear', 'greed'].slice(0, Math.floor(Math.random() * 3) + 1),
        suspiciousPhrases: Math.floor(Math.random() * 10),
        riskIndicators: {
          psychological: Math.random() * 100,
          linguistic: Math.random() * 100,
          behavioral: Math.random() * 100
        }
      };
    }
    
    if (data.enabledTests.tradingAnalysis) {
      results.tradingAnalysis = {
        riskScore: Math.random() * 100,
        anomalies: {
          volumeSpikes: Math.floor(Math.random() * 5),
          priceManipulation: Math.random() > 0.5,
          pumpDumpIndicators: Math.random() > 0.7
        },
        tradingPattern: ['normal', 'suspicious', 'highly suspicious'][Math.floor(Math.random() * 3)],
        newsCorrelation: Math.random() > 0.5
      };
    }
    
    if (data.enabledTests.veracityCheck) {
      results.veracityCheck = {
        riskScore: Math.random() * 100,
        exists: Math.random() > 0.2,
        verified: Math.random() > 0.3,
        lawEnforcementFlags: Math.floor(Math.random() * 2),
        regulatoryCompliance: Math.random() > 0.5,
        exchangesListed: Math.floor(Math.random() * 5) + 1
      };
    }
    
    // Calculate overall risk score
    let totalScore = 0;
    let testCount = 0;
    
    if (results.contactVerification) {
      totalScore += results.contactVerification.riskScore;
      testCount++;
    }
    if (results.chatAnalysis) {
      totalScore += results.chatAnalysis.overallRiskScore;
      testCount++;
    }
    if (results.tradingAnalysis) {
      totalScore += results.tradingAnalysis.riskScore;
      testCount++;
    }
    if (results.veracityCheck) {
      totalScore += results.veracityCheck.riskScore;
      testCount++;
    }
    
    results.overallRiskScore = testCount > 0 ? totalScore / testCount : 0;
    results.timestamp = new Date();
    results.testsCompleted = testCount;
    
    return results;
  }
}

export const detectionService = new DetectionService();