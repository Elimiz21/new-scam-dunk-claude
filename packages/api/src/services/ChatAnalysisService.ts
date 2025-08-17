import OpenAI from 'openai';
import NodeCache from 'node-cache';
import ChatAnalysis, { IChatAnalysis } from '../models/ChatAnalysis';
import { logger } from '../index';
import natural from 'natural';
import sentiment from 'sentiment';

interface ChatMessage {
  id: number;
  timestamp: Date;
  sender: string;
  text: string;
  metadata?: any;
}

interface ScamPattern {
  pattern: RegExp;
  type: 'urgency' | 'money_request' | 'personal_info' | 'suspicious_links' | 'fake_authority' | 'too_good_to_be_true';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

class ChatAnalysisService {
  private openai: OpenAI;
  private cache: NodeCache;
  private sentimentAnalyzer: any;
  private scamPatterns: ScamPattern[];
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo-key'
    });
    this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    this.sentimentAnalyzer = new sentiment();
    this.initializeScamPatterns();
  }
  
  private initializeScamPatterns() {
    this.scamPatterns = [
      // Urgency patterns
      {
        pattern: /\b(urgent|immediately|asap|right now|act fast|limited time|expires today|last chance)\b/gi,
        type: 'urgency',
        description: 'Creates false sense of urgency',
        severity: 'medium'
      },
      {
        pattern: /\b(emergency|crisis|deadline|time sensitive|don't wait|hurry)\b/gi,
        type: 'urgency',
        description: 'Emergency language to pressure quick decisions',
        severity: 'high'
      },
      
      // Money request patterns
      {
        pattern: /\b(send money|wire transfer|bitcoin|crypto|western union|moneygram|gift card|steam card)\b/gi,
        type: 'money_request',
        description: 'Requests for money or untraceable payment methods',
        severity: 'high'
      },
      {
        pattern: /\$[\d,]+|\b\d+\s*(dollars?|usd|euros?|pounds?)\b/gi,
        type: 'money_request',
        description: 'Mentions specific monetary amounts',
        severity: 'medium'
      },
      {
        pattern: /\b(investment|profit|returns|guaranteed|double your money|make money fast)\b/gi,
        type: 'money_request',
        description: 'Investment or get-rich-quick schemes',
        severity: 'high'
      },
      
      // Personal information patterns
      {
        pattern: /\b(ssn|social security|passport|driver.?license|bank account|routing number|credit card)\b/gi,
        type: 'personal_info',
        description: 'Requests for sensitive personal information',
        severity: 'high'
      },
      {
        pattern: /\b(password|pin|otp|verification code|security code|login)\b/gi,
        type: 'personal_info',
        description: 'Requests for login credentials or security codes',
        severity: 'high'
      },
      
      // Suspicious links patterns
      {
        pattern: /bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|sus\.link/gi,
        type: 'suspicious_links',
        description: 'Contains shortened URLs that may hide malicious links',
        severity: 'medium'
      },
      {
        pattern: /click.*here|download.*now|visit.*link|follow.*link/gi,
        type: 'suspicious_links',
        description: 'Encourages clicking on links',
        severity: 'medium'
      },
      
      // Fake authority patterns
      {
        pattern: /\b(irs|fbi|police|government|tax|audit|legal action|arrest|warrant)\b/gi,
        type: 'fake_authority',
        description: 'Impersonates government or law enforcement',
        severity: 'high'
      },
      {
        pattern: /\b(bank|microsoft|apple|amazon|google|paypal|verified|official)\b/gi,
        type: 'fake_authority',
        description: 'Impersonates trusted companies or brands',
        severity: 'high'
      },
      
      // Too good to be true patterns
      {
        pattern: /\b(free|winner|won|lottery|prize|congratulations|selected|chosen)\b/gi,
        type: 'too_good_to_be_true',
        description: 'Claims of free prizes or winnings',
        severity: 'medium'
      },
      {
        pattern: /\b(100% guaranteed|risk free|no questions asked|limited offer|exclusive deal)\b/gi,
        type: 'too_good_to_be_true',
        description: 'Unrealistic promises or guarantees',
        severity: 'high'
      }
    ];
  }
  
  async analyzeChat(
    messages: ChatMessage[],
    platform: string,
    scanId: string,
    analysisDepth: 'basic' | 'standard' | 'comprehensive' = 'standard'
  ): Promise<IChatAnalysis> {
    try {
      logger.info(`Starting chat analysis for scan ${scanId} with ${messages.length} messages`);
      
      const startTime = Date.now();
      let tokenCount = 0;
      
      // Extract basic information
      const messageCount = messages.length;
      const participants = [...new Set(messages.map(m => m.sender))];
      const participantCount = participants.length;
      const dateRange = {
        startDate: new Date(Math.min(...messages.map(m => m.timestamp.getTime()))),
        endDate: new Date(Math.max(...messages.map(m => m.timestamp.getTime())))
      };
      
      // Perform sentiment analysis
      const sentimentAnalysis = await this.performSentimentAnalysis(messages);
      
      // Detect scam indicators
      const scamIndicators = await this.detectScamIndicators(messages);
      
      // Analyze language
      const languageAnalysis = await this.performLanguageAnalysis(messages);
      
      // Extract entities
      const entities = await this.extractEntities(messages);
      
      // Detect patterns
      const patterns = await this.detectPatterns(messages);
      
      // Perform AI analysis using OpenAI
      const aiAnalysis = await this.performAIAnalysis(messages, analysisDepth);
      tokenCount += aiAnalysis.tokensUsed;
      
      // Calculate risk assessment
      const riskAssessment = await this.calculateRiskAssessment(
        scamIndicators,
        entities,
        patterns,
        aiAnalysis,
        sentimentAnalysis
      );
      
      const processingTime = Date.now() - startTime;
      const costEstimate = this.calculateCostEstimate(tokenCount, analysisDepth);
      
      // Create analysis record
      const analysisData: Partial<IChatAnalysis> = {
        scanId,
        platform: platform as any,
        messageCount,
        participantCount,
        dateRange,
        sentimentAnalysis,
        scamIndicators,
        languageAnalysis,
        entities,
        patterns,
        riskAssessment,
        aiAnalysis: {
          model: aiAnalysis.model,
          version: aiAnalysis.version,
          summary: aiAnalysis.summary,
          keyFindings: aiAnalysis.keyFindings,
          suspiciousMessages: aiAnalysis.suspiciousMessages.filter(msg => msg !== null),
          contextualAnalysis: aiAnalysis.contextualAnalysis
        },
        metadata: {
          processingTime,
          analysisDepth,
          aiTokensUsed: tokenCount,
          costEstimate
        }
      };
      
      const analysis = new ChatAnalysis(analysisData);
      await analysis.save();
      
      logger.info(`Chat analysis completed for scan ${scanId} with risk score: ${riskAssessment.overallRisk}`);
      return analysis;
      
    } catch (error) {
      logger.error('Chat analysis failed:', error);
      throw error;
    }
  }
  
  private async performSentimentAnalysis(messages: ChatMessage[]) {
    const combinedText = messages.map(m => m.text).join(' ');
    const result = this.sentimentAnalyzer.analyze(combinedText);
    
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.comparative));
    
    let overall: 'positive' | 'neutral' | 'negative';
    if (normalizedScore > 0.1) overall = 'positive';
    else if (normalizedScore < -0.1) overall = 'negative';
    else overall = 'neutral';
    
    // Simulate emotion detection (in production, use a dedicated emotion API)
    const emotions = this.detectEmotions(combinedText);
    
    return {
      overall,
      score: normalizedScore,
      emotions
    };
  }
  
  private detectEmotions(text: string) {
    const emotionPatterns = {
      anger: /\b(angry|mad|furious|rage|hate|pissed)\b/gi,
      fear: /\b(scared|afraid|terrified|worried|anxious|panic)\b/gi,
      joy: /\b(happy|excited|glad|thrilled|amazing|awesome)\b/gi,
      sadness: /\b(sad|depressed|upset|disappointed|heartbroken)\b/gi,
      surprise: /\b(surprised|shocked|amazed|stunned|wow)\b/gi,
      trust: /\b(trust|reliable|honest|genuine|authentic)\b/gi,
      disgust: /\b(disgusting|gross|awful|terrible|horrible)\b/gi
    };
    
    const emotions = [];
    for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        emotions.push({
          emotion,
          confidence: Math.min(1, matches.length * 0.1 + 0.3),
          intensity: Math.min(1, matches.length * 0.15 + 0.2)
        });
      }
    }
    
    return emotions;
  }
  
  private async detectScamIndicators(messages: ChatMessage[]) {
    const indicators = [];
    
    for (const pattern of this.scamPatterns) {
      const instances = [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const matches = message.text.match(pattern.pattern);
        
        if (matches) {
          instances.push({
            messageIndex: i,
            text: message.text,
            timestamp: message.timestamp,
            participant: message.sender
          });
        }
      }
      
      if (instances.length > 0) {
        const confidence = Math.min(100, instances.length * 20 + 30);
        
        indicators.push({
          type: pattern.type,
          confidence,
          instances,
          description: pattern.description
        });
      }
    }
    
    return indicators;
  }
  
  private async performLanguageAnalysis(messages: ChatMessage[]) {
    const combinedText = messages.map(m => m.text).join(' ');
    
    // Detect primary language (simplified - in production use proper language detection)
    const primaryLanguage = this.detectLanguage(combinedText);
    
    // Analyze formality
    const formality = this.analyzeFormality(combinedText);
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(combinedText);
    
    return {
      primaryLanguage,
      languages: [{ language: primaryLanguage, confidence: 0.9 }],
      formality,
      complexity
    };
  }
  
  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
    
    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const frenchCount = words.filter(word => frenchWords.includes(word)).length;
    
    if (englishCount > spanishCount && englishCount > frenchCount) return 'en';
    if (spanishCount > frenchCount) return 'es';
    if (frenchCount > 0) return 'fr';
    return 'en'; // Default to English
  }
  
  private analyzeFormality(text: string): 'formal' | 'informal' | 'mixed' {
    const formalWords = ['please', 'kindly', 'respectfully', 'sincerely', 'regard', 'appreciate'];
    const informalWords = ['hey', 'hi', 'yeah', 'ok', 'lol', 'omg', 'btw', 'thx'];
    
    const words = text.toLowerCase().split(/\s+/);
    const formalCount = words.filter(word => formalWords.includes(word)).length;
    const informalCount = words.filter(word => informalWords.includes(word)).length;
    
    if (formalCount > informalCount * 2) return 'formal';
    if (informalCount > formalCount * 2) return 'informal';
    return 'mixed';
  }
  
  private analyzeComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = text.split(/\s+/).length / Math.max(sentences.length, 1);
    
    if (avgWordsPerSentence < 10) return 'simple';
    if (avgWordsPerSentence < 20) return 'moderate';
    return 'complex';
  }
  
  private async extractEntities(messages: ChatMessage[]) {
    const entities: any[] = [];
    const combinedText = messages.map(m => m.text).join(' ');
    
    // Extract different types of entities
    const phoneNumbers = this.extractPhoneNumbers(combinedText);
    const emails = this.extractEmails(combinedText);
    const urls = this.extractUrls(combinedText);
    const cryptoAddresses = this.extractCryptoAddresses(combinedText);
    const bankAccounts = this.extractBankAccounts(combinedText);
    
    // Add phone numbers
    phoneNumbers.forEach(phone => {
      entities.push({
        type: 'phone' as const,
        value: phone,
        confidence: 0.9,
        mentions: (combinedText.match(new RegExp(phone.replace(/[^\d]/g, ''), 'g')) || []).length,
        context: this.getEntityContext(combinedText, phone)
      });
    });
    
    // Add emails
    emails.forEach(email => {
      entities.push({
        type: 'email' as const,
        value: email,
        confidence: 0.95,
        mentions: (combinedText.match(new RegExp(email, 'gi')) || []).length,
        context: this.getEntityContext(combinedText, email)
      });
    });
    
    // Add URLs
    urls.forEach(url => {
      entities.push({
        type: 'url' as const,
        value: url,
        confidence: 0.9,
        mentions: (combinedText.match(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length,
        context: this.getEntityContext(combinedText, url)
      });
    });
    
    // Add crypto addresses
    cryptoAddresses.forEach(address => {
      entities.push({
        type: 'crypto_address' as const,
        value: address,
        confidence: 0.85,
        mentions: (combinedText.match(new RegExp(address, 'g')) || []).length,
        context: this.getEntityContext(combinedText, address)
      });
    });
    
    return entities;
  }
  
  private extractPhoneNumbers(text: string): string[] {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    return text.match(phoneRegex) || [];
  }
  
  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }
  
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }
  
  private extractCryptoAddresses(text: string): string[] {
    // Bitcoin addresses
    const btcRegex = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
    const btcMatches = text.match(btcRegex) || [];
    
    // Ethereum addresses
    const ethRegex = /\b0x[a-fA-F0-9]{40}\b/g;
    const ethMatches = text.match(ethRegex) || [];
    
    return [...btcMatches, ...ethMatches];
  }
  
  private extractBankAccounts(text: string): string[] {
    // Simplified bank account detection
    const accountRegex = /\b\d{8,17}\b/g;
    const potentialAccounts = text.match(accountRegex) || [];
    
    // Filter out obvious non-account numbers (like phone numbers)
    return potentialAccounts.filter(num => num.length >= 10 && num.length <= 17);
  }
  
  private getEntityContext(text: string, entity: string): string[] {
    const entityIndex = text.toLowerCase().indexOf(entity.toLowerCase());
    if (entityIndex === -1) return [];
    
    const start = Math.max(0, entityIndex - 50);
    const end = Math.min(text.length, entityIndex + entity.length + 50);
    
    return [text.substring(start, end).trim()];
  }
  
  private async detectPatterns(messages: ChatMessage[]) {
    const patterns = [];
    const combinedText = messages.map(m => m.text).join(' ');
    
    // Detect repetitive messages
    const messageTexts = messages.map(m => m.text.toLowerCase().trim());
    const duplicates = messageTexts.filter((text, index) =>
      messageTexts.indexOf(text) !== index
    );
    
    if (duplicates.length > 0) {
      patterns.push({
        pattern: 'repetitive_messages',
        matches: duplicates.length,
        severity: 'medium' as const,
        description: 'Multiple identical or near-identical messages detected',
        examples: [...new Set(duplicates)].slice(0, 3)
      });
    }
    
    // Detect rapid-fire messaging
    const timestamps = messages.map(m => m.timestamp.getTime()).sort((a, b) => a - b);
    let rapidMessages = 0;
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i - 1] < 1000) { // Less than 1 second apart
        rapidMessages++;
      }
    }
    
    if (rapidMessages > 5) {
      patterns.push({
        pattern: 'rapid_messaging',
        matches: rapidMessages,
        severity: 'medium' as const,
        description: 'Unusually rapid message sending detected',
        examples: ['Multiple messages sent within seconds of each other']
      });
    }
    
    return patterns;
  }
  
  private async performAIAnalysis(messages: ChatMessage[], depth: string) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
        return this.simulateAIAnalysis(messages, depth);
      }
      
      const conversationText = messages.map(m =>
        `[${m.timestamp.toISOString()}] ${m.sender}: ${m.text}`
      ).join('\n');
      
      const prompt = this.buildAnalysisPrompt(conversationText, depth);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fraud detection analyst specializing in identifying scams, fraud, and suspicious communications. Analyze the provided conversation and provide detailed insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: depth === 'comprehensive' ? 2000 : depth === 'standard' ? 1000 : 500,
        temperature: 0.1
      });
      
      const analysis = response.choices[0].message.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      
      return this.parseAIAnalysis(analysis || '', tokensUsed);
      
    } catch (error) {
      logger.error('OpenAI API error:', error);
      return this.simulateAIAnalysis(messages, depth);
    }
  }
  
  private buildAnalysisPrompt(conversationText: string, depth: string): string {
    const basePrompt = `
Analyze the following conversation for potential scams, fraud, or suspicious activity:

${conversationText}

Please provide:
1. A concise summary of the conversation
2. Key findings related to scam/fraud indicators
3. Suspicious messages with explanations
4. Contextual analysis of the communication patterns
5. Risk assessment and recommendations

Focus on identifying:
- Social engineering tactics
- Urgency manipulation
- Requests for money or personal information
- Impersonation attempts
- Phishing or malware distribution
- Investment scams
- Romance scams
- Technical support scams

Format your response as a structured analysis.`;
    
    if (depth === 'comprehensive') {
      return basePrompt + `
      
Additionally, provide:
- Deep behavioral analysis
- Communication timeline analysis
- Advanced pattern recognition
- Cross-reference with known scam databases
- Detailed psychological manipulation techniques identified`;
    }
    
    return basePrompt;
  }
  
  private parseAIAnalysis(analysis: string, tokensUsed: number) {
    // Parse the AI response (simplified - in production, use more robust parsing)
    const lines = analysis.split('\n').filter(line => line.trim());
    
    const summary = lines.find(line => line.toLowerCase().includes('summary'))?.replace(/.*summary:?\s*/i, '') || 
                   'AI analysis completed';
    
    const keyFindings = lines.filter(line =>
      line.includes('finding') || line.includes('indicator') || line.includes('detected')
    ).slice(0, 5);
    
    const suspiciousMessages = this.extractSuspiciousMessages(analysis);
    
    return {
      model: 'gpt-4',
      version: '2024-08',
      summary,
      keyFindings,
      suspiciousMessages,
      contextualAnalysis: analysis,
      tokensUsed
    };
  }
  
  private simulateAIAnalysis(messages: ChatMessage[], depth: string) {
    // Simulate AI analysis when OpenAI API is not available
    const riskWords = ['money', 'urgent', 'investment', 'winner', 'bitcoin', 'transfer', 'account'];
    const combinedText = messages.map(m => m.text).join(' ').toLowerCase();
    
    const riskWordsFound = riskWords.filter(word => combinedText.includes(word));
    const riskLevel = riskWordsFound.length > 3 ? 'high' : riskWordsFound.length > 1 ? 'medium' : 'low';
    
    const suspiciousMessages = messages
      .map((msg, index) => {
        const suspiciousWords = riskWords.filter(word => msg.text.toLowerCase().includes(word));
        if (suspiciousWords.length > 0) {
          return {
            messageIndex: index,
            text: msg.text,
            reason: `Contains suspicious keywords: ${suspiciousWords.join(', ')}`,
            severity: suspiciousWords.length * 20
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 5);
    
    return {
      model: 'simulated-gpt-4',
      version: '2024-sim',
      summary: `Conversation analysis completed. Risk level: ${riskLevel}. Found ${riskWordsFound.length} risk indicators.`,
      keyFindings: [
        `${riskWordsFound.length} suspicious keywords detected`,
        `Conversation involves ${new Set(messages.map(m => m.sender)).size} participants`,
        `${messages.length} total messages analyzed`,
        riskLevel === 'high' ? 'Multiple scam indicators present' : 'Normal conversation patterns detected'
      ].filter(Boolean),
      suspiciousMessages,
      contextualAnalysis: `This conversation has been analyzed for scam indicators. The overall risk level is ${riskLevel} based on the presence of ${riskWordsFound.length} suspicious keywords and patterns.`,
      tokensUsed: messages.length * 4 // Simulate token usage
    };
  }
  
  private extractSuspiciousMessages(analysis: string) {
    // Extract suspicious messages from AI analysis (simplified)
    const messagePattern = /message\s*(\d+)[:\s]*(.*?)(?=message\s*\d+|$)/gi;
    const matches = [...analysis.matchAll(messagePattern)];
    
    return matches.slice(0, 5).map(match => ({
      messageIndex: parseInt(match[1]) - 1,
      text: match[2].trim(),
      reason: 'Identified by AI as suspicious',
      severity: 75
    }));
  }
  
  private async calculateRiskAssessment(
    scamIndicators: any[],
    entities: any[],
    patterns: any[],
    aiAnalysis: any,
    sentimentAnalysis: any
  ) {
    let riskScore = 0;
    const riskFactors = [];
    const redFlags = [];
    
    // Analyze scam indicators
    scamIndicators.forEach(indicator => {
      const weight = this.getIndicatorWeight(indicator.type, indicator.confidence);
      riskScore += weight;
      riskFactors.push({
        factor: `scam_indicator_${indicator.type}`,
        weight,
        evidence: indicator.instances.map((i: any) => i.text).slice(0, 3)
      });
      
      if (indicator.confidence > 70) {
        redFlags.push(`High confidence ${indicator.type} detected`);
      }
    });
    
    // Analyze entities
    const riskyEntities = entities.filter(e =>
      ['crypto_address', 'bank_account'].includes(e.type) ||
      (e.type === 'url' && this.isUrlSuspicious(e.value))
    );
    
    if (riskyEntities.length > 0) {
      const weight = riskyEntities.length * 15;
      riskScore += weight;
      riskFactors.push({
        factor: 'risky_entities',
        weight,
        evidence: riskyEntities.map(e => `${e.type}: ${e.value}`).slice(0, 3)
      });
      redFlags.push(`${riskyEntities.length} risky entities detected`);
    }
    
    // Analyze patterns
    patterns.forEach(pattern => {
      const weight = this.getPatternWeight(pattern.severity, pattern.matches);
      riskScore += weight;
      riskFactors.push({
        factor: `pattern_${pattern.pattern}`,
        weight,
        evidence: pattern.examples.slice(0, 2)
      });
    });
    
    // Factor in sentiment
    if (sentimentAnalysis.overall === 'negative' && sentimentAnalysis.score < -0.5) {
      const weight = 10;
      riskScore += weight;
      riskFactors.push({
        factor: 'negative_sentiment',
        weight,
        evidence: ['Highly negative sentiment detected in conversation']
      });
    }
    
    // Factor in AI analysis
    const suspiciousMessageCount = aiAnalysis.suspiciousMessages.length;
    if (suspiciousMessageCount > 0) {
      const weight = suspiciousMessageCount * 8;
      riskScore += weight;
      riskFactors.push({
        factor: 'ai_suspicious_messages',
        weight,
        evidence: aiAnalysis.suspiciousMessages.map((m: any) => m.reason).slice(0, 3)
      });
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Calculate confidence based on multiple factors
    const confidence = Math.min(100, 50 + (scamIndicators.length * 10) + (patterns.length * 5));
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, scamIndicators, entities);
    
    return {
      overallRisk: Math.round(riskScore),
      riskLevel,
      confidence,
      riskFactors,
      redFlags,
      recommendations
    };
  }
  
  private getIndicatorWeight(type: string, confidence: number): number {
    const baseWeights = {
      urgency: 15,
      money_request: 25,
      personal_info: 30,
      suspicious_links: 20,
      fake_authority: 25,
      too_good_to_be_true: 20
    };
    
    return (baseWeights[type as keyof typeof baseWeights] || 10) * (confidence / 100);
  }
  
  private getPatternWeight(severity: string, matches: number): number {
    const severityMultipliers = { low: 1, medium: 1.5, high: 2 };
    return Math.min(20, matches * 5 * (severityMultipliers[severity as keyof typeof severityMultipliers] || 1));
  }
  
  private isUrlSuspicious(url: string): boolean {
    const suspiciousPatterns = [
      /bit\.ly|tinyurl|t\.co/,
      /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
      /secure|bank|login|verify/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
  
  private generateRecommendations(
    riskLevel: string,
    scamIndicators: any[],
    entities: any[]
  ): string[] {
    const recommendations = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('⚠️ HIGH RISK: This conversation shows strong indicators of a scam');
      recommendations.push('Do not send money or share personal information');
      recommendations.push('Verify the identity of all participants through independent means');
      recommendations.push('Report this conversation to relevant authorities');
    }
    
    if (scamIndicators.some(i => i.type === 'money_request')) {
      recommendations.push('Never send money to unknown individuals');
      recommendations.push('Be suspicious of requests for cryptocurrency or gift cards');
    }
    
    if (scamIndicators.some(i => i.type === 'personal_info')) {
      recommendations.push('Never share personal information like SSN, passwords, or bank details');
    }
    
    if (entities.some(e => e.type === 'url')) {
      recommendations.push('Do not click on suspicious links');
      recommendations.push('Verify URLs independently before visiting');
    }
    
    if (riskLevel === 'low') {
      recommendations.push('Conversation appears normal, but remain vigilant');
      recommendations.push('Always verify identity before sharing sensitive information');
    }
    
    return recommendations;
  }
  
  private calculateCostEstimate(tokens: number, depth: string): number {
    // Estimate cost based on OpenAI pricing (as of 2024)
    const costPerToken = 0.00003; // ~$0.03 per 1K tokens for GPT-4
    return tokens * costPerToken;
  }
  
  async getAnalysisHistory(scanId: string): Promise<IChatAnalysis | null> {
    return ChatAnalysis.findOne({ scanId });
  }
  
  async getHighRiskAnalyses(limit: number = 20): Promise<IChatAnalysis[]> {
    return ChatAnalysis.find({ 'riskAssessment.riskLevel': { $in: ['high', 'critical'] } })
      .sort({ 'riskAssessment.overallRisk': -1, createdAt: -1 })
      .limit(limit)
      .populate('scanId', 'userId type');
  }
  
  async getAnalysesByPlatform(platform: string, limit: number = 20): Promise<IChatAnalysis[]> {
    return ChatAnalysis.find({ platform })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('scanId', 'userId type');
  }
}

export default new ChatAnalysisService();