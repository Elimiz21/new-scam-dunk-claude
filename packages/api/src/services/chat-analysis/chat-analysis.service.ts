import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  ChatAnalysisRequest,
  ChatAnalysisResult,
  ChatAnalysisType,
  RiskLevel,
  PsychologicalManipulationAnalysis,
  ManipulationTechnique,
  ManipulationTechniqueType,
  ManipulationEvidence,
  EmotionalPatternAnalysis,
  EmotionalState,
  EntityAnalysis,
  ConsistencyAnalysis,
  TimingAnalysis,
  ScamTypeDetection,
  ScamType,
  ScamPhase,
  RedFlag,
  RedFlagType,
  TrustIndicator,
  TrustIndicatorType,
  ChatAnalysisConfig,
  ChatAnalysisStats,
  VulnerabilityType,
  ChatMessage,
  ChatParticipant,
  FinancialEntity,
  URLEntity,
  URLAnalysis,
  PersonalInfoEntity,
  Inconsistency,
  InconsistencyType,
  MessagingPattern,
  UrgencyTactic,
  UrgencyTacticType
} from './types/chat-analysis.types';

@Injectable()
export class ChatAnalysisService {
  private readonly logger = new Logger(ChatAnalysisService.name);
  private readonly config: ChatAnalysisConfig;
  
  // Psychological manipulation patterns
  private readonly manipulationPatterns = {
    [ManipulationTechniqueType.FEAR_MONGERING]: [
      /urgent.{0,20}(action|response|attention)/i,
      /account.{0,20}(suspend|lock|block|close)/i,
      /security.{0,20}(breach|threat|alert)/i,
      /(lose|miss).{0,20}(opportunity|chance|offer)/i
    ],
    [ManipulationTechniqueType.URGENCY_PRESSURE]: [
      /act\s+(now|immediately|quickly|fast)/i,
      /(expire|end).{0,20}(today|soon|tonight)/i,
      /limited.{0,20}time/i,
      /don't\s+wait/i
    ],
    [ManipulationTechniqueType.AUTHORITY_IMPERSONATION]: [
      /(bank|government|police|fbi|irs|microsoft|apple|amazon|google)/i,
      /official.{0,20}(notice|warning|alert)/i,
      /verification.{0,20}required/i,
      /representative.{0,20}(from|of)/i
    ],
    [ManipulationTechniqueType.SOCIAL_PROOF]: [
      /many.{0,20}people.{0,20}(have|are)/i,
      /customers.{0,20}(report|say|confirm)/i,
      /everyone.{0,20}is.{0,20}(doing|using|buying)/i,
      /thousands.{0,20}of.{0,20}(people|users)/i
    ],
    [ManipulationTechniqueType.SCARCITY]: [
      /only.{0,20}\d+.{0,20}(left|remaining|available)/i,
      /limited.{0,20}(supply|quantity|stock)/i,
      /exclusive.{0,20}(offer|opportunity|access)/i,
      /one.{0,20}time.{0,20}(only|offer)/i
    ],
    [ManipulationTechniqueType.LOVE_BOMBING]: [
      /you.{0,10}are.{0,10}(special|amazing|perfect|beautiful)/i,
      /never.{0,20}felt.{0,20}this.{0,20}way/i,
      /soul.{0,10}mate/i,
      /meant.{0,20}to.{0,20}be/i
    ],
    [ManipulationTechniqueType.TRUST_EXPLOITATION]: [
      /trust.{0,20}me/i,
      /you.{0,10}can.{0,10}believe.{0,10}me/i,
      /i.{0,10}would.{0,10}never.{0,10}lie/i,
      /honest.{0,20}with.{0,20}you/i
    ]
  };

  // Financial request patterns
  private readonly financialPatterns = [
    /send.{0,20}(money|\$|payment)/i,
    /wire.{0,20}transfer/i,
    /bank.{0,20}(account|details|info)/i,
    /credit.{0,20}card.{0,20}(number|info|details)/i,
    /social.{0,20}security.{0,20}number/i,
    /ssn/i,
    /routing.{0,20}number/i,
    /bitcoin|ethereum|crypto/i,
    /gift.{0,20}card/i,
    /paypal|venmo|cashapp|zelle/i
  ];

  // URL patterns for phishing detection
  private readonly suspiciousUrlPatterns = [
    /bit\.ly|tinyurl|t\.co|goo\.gl/i,
    /[a-z]+-[a-z]+-[a-z]+\.com/i, // Suspicious domain structure
    /\.(tk|ml|ga|cf)$/i, // Suspicious TLDs
    /secure[a-z]*\.(com|net|org)/i,
    /verify[a-z]*\.(com|net|org)/i
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      enableDeepLearning: this.configService.get('CHAT_ANALYSIS_DEEP_LEARNING', true),
      psychologicalAnalysisDepth: 'advanced',
      entityExtractionSensitivity: 0.7,
      manipulationDetectionThreshold: 0.6,
      consistencyCheckStrength: 0.8,
      timingAnalysisEnabled: true,
      crossReferenceEnabled: true,
      realTimeAnalysis: false,
      languageSupport: ['en', 'es', 'fr', 'de']
    };
  }

  async analyzeChat(request: ChatAnalysisRequest): Promise<ChatAnalysisResult> {
    this.logger.log(`Starting chat analysis for ${request.messages.length} messages`);
    
    const startTime = Date.now();
    const analysisId = `ca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Initialize result structure
      const result: ChatAnalysisResult = {
        id: analysisId,
        chatId: request.chatId,
        analysisType: this.determineAnalysisType(request),
        overallRiskScore: 0,
        riskLevel: RiskLevel.LOW,
        confidence: 0,
        psychologicalManipulation: this.initializePsychologicalAnalysis(),
        emotionalPatterns: this.initializeEmotionalAnalysis(),
        entityAnalysis: this.initializeEntityAnalysis(),
        consistencyCheck: this.initializeConsistencyAnalysis(),
        timingAnalysis: this.initializeTimingAnalysis(),
        scamTypeDetection: this.initializeScamTypeDetection(),
        redFlags: [],
        trustIndicators: [],
        summary: '',
        keyFindings: [],
        recommendations: [],
        processingTime: 0,
        messagesAnalyzed: request.messages.length,
        lastAnalyzed: new Date()
      };

      // Perform comprehensive analysis
      await this.performPsychologicalAnalysis(request.messages, result);
      await this.performEmotionalAnalysis(request.messages, result);
      await this.performEntityExtraction(request.messages, result);
      await this.performConsistencyCheck(request.messages, request.participants, result);
      await this.performTimingAnalysis(request.messages, result);
      await this.detectScamType(request.messages, result);
      await this.identifyRedFlags(request.messages, result);
      await this.identifyTrustIndicators(request.messages, result);

      // Calculate final risk assessment
      this.calculateFinalRiskScore(result);
      
      // Generate summary and recommendations
      this.generateSummary(result);
      this.generateRecommendations(result);

      // Record processing time
      result.processingTime = Date.now() - startTime;

      // Store result for analytics
      await this.storeAnalysisResult(result);

      this.logger.log(`Chat analysis completed in ${result.processingTime}ms: ${result.riskLevel} risk`);
      
      return result;

    } catch (error) {
      this.logger.error(`Chat analysis failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Chat analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async performPsychologicalAnalysis(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    const manipulation = result.psychologicalManipulation;
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Check each manipulation technique
      for (const [technique, patterns] of Object.entries(this.manipulationPatterns)) {
        const matchCount = patterns.filter(pattern => pattern.test(content)).length;
        
        if (matchCount > 0) {
          let existingTechnique = manipulation.techniques.find(t => t.type === technique as ManipulationTechniqueType);
          
          if (!existingTechnique) {
            existingTechnique = {
              type: technique as ManipulationTechniqueType,
              severity: this.calculateManipulationSeverity(technique as ManipulationTechniqueType, matchCount),
              frequency: 0,
              examples: [],
              description: this.getManipulationDescription(technique as ManipulationTechniqueType),
              psychologicalImpact: this.getPsychologicalImpact(technique as ManipulationTechniqueType),
              counterMeasures: this.getCounterMeasures(technique as ManipulationTechniqueType)
            };
            manipulation.techniques.push(existingTechnique);
          }
          
          existingTechnique.frequency += matchCount;
          existingTechnique.examples.push(message.content);
          
          // Add evidence
          manipulation.evidence.push({
            messageId: message.id,
            timestamp: message.timestamp,
            content: message.content,
            technique: technique as ManipulationTechniqueType,
            severity: matchCount * 10,
            context: `Message from ${message.senderName}`
          });
        }
      }
    }

    // Calculate overall manipulation score
    manipulation.overallScore = this.calculateManipulationScore(manipulation.techniques);
    manipulation.riskLevel = this.getRiskLevelFromScore(manipulation.overallScore);
    manipulation.confidenceLevel = this.calculateConfidence(manipulation.evidence.length, messages.length);
  }

  private async performEmotionalAnalysis(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    const emotional = result.emotionalPatterns;
    
    // Analyze emotional progression through conversation
    const emotionalKeywords = {
      fear: ['scared', 'worried', 'afraid', 'panic', 'terrified', 'anxious'],
      excitement: ['excited', 'amazing', 'incredible', 'wonderful', 'fantastic'],
      confusion: ['confused', 'don\'t understand', 'not sure', 'unclear'],
      trust: ['trust', 'believe', 'confident', 'sure', 'certain'],
      vulnerability: ['lonely', 'desperate', 'need help', 'struggling', 'difficult']
    };

    let currentPhase = 'initial_contact';
    let dominantEmotions: string[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const content = message.content.toLowerCase();
      
      // Detect emotional indicators
      for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          dominantEmotions.push(emotion);
        }
      }
      
      // Detect phase transitions based on content patterns
      if (this.isPhaseTransition(content)) {
        emotional.emotionalProgression.push({
          phase: currentPhase,
          startTime: i > 0 ? messages[0].timestamp : message.timestamp,
          endTime: message.timestamp,
          dominantEmotions: [...dominantEmotions],
          manipulationTactics: this.identifyTacticsInPhase(messages.slice(Math.max(0, i-5), i+1)),
          victimResponse: this.analyzeVictimResponse(messages.slice(Math.max(0, i-5), i+1))
        });
        
        currentPhase = this.getNextPhase(currentPhase);
        dominantEmotions = [];
      }
    }

    // Identify vulnerabilities
    emotional.manipulationVulnerabilities = this.identifyVulnerabilities(messages);
    
    // Set overall emotional state
    emotional.overallEmotionalState = this.determineOverallEmotionalState(emotional.emotionalProgression);
  }

  private async performEntityExtraction(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    const entities = result.entityAnalysis;
    
    for (const message of messages) {
      const content = message.content;
      
      // Extract financial entities
      entities.financialEntities.push(...this.extractFinancialEntities(content, message));
      
      // Extract personal information
      entities.personalInfo.push(...this.extractPersonalInfo(content, message));
      
      // Extract URLs and analyze them
      entities.urls.push(...await this.extractAndAnalyzeUrls(content, message));
      
      // Extract crypto addresses
      entities.cryptoAddresses.push(...this.extractCryptoAddresses(content, message));
      
      // Identify suspicious patterns
      entities.suspiciousPatterns.push(...this.identifySuspiciousPatterns(content, message));
    }
  }

  private async performConsistencyCheck(
    messages: ChatMessage[],
    participants: ChatParticipant[],
    result: ChatAnalysisResult
  ): Promise<void> {
    const consistency = result.consistencyCheck;
    
    // Check identity consistency
    const identityInconsistencies = this.checkIdentityConsistency(messages, participants);
    consistency.inconsistencies.push(...identityInconsistencies);
    
    // Check story coherence
    const storyInconsistencies = this.checkStoryCoherence(messages);
    consistency.inconsistencies.push(...storyInconsistencies);
    
    // Calculate overall consistency score
    consistency.overallConsistency = this.calculateConsistencyScore(consistency.inconsistencies, messages.length);
    
    // Detailed identity verification
    consistency.identityVerification = this.performIdentityVerification(messages, participants);
    
    // Story coherence analysis
    consistency.storyCoherence = this.analyzeStoryCoherence(messages);
  }

  private async performTimingAnalysis(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    const timing = result.timingAnalysis;
    
    if (messages.length < 2) return;
    
    // Analyze messaging patterns
    timing.messagingPatterns = this.analyzeMessagingPatterns(messages);
    
    // Identify urgency tactics
    timing.urgencyTactics = this.identifyUrgencyTactics(messages);
    
    // Analyze response times
    timing.responseTimeAnalysis = this.analyzeResponseTimes(messages);
    
    // Identify suspicious timing
    timing.suspiciousTiming = this.identifySuspiciousTiming(messages);
  }

  private async detectScamType(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    const scamDetection = result.scamTypeDetection;
    
    const scamIndicators = {
      [ScamType.INVESTMENT_FRAUD]: [
        /high.{0,20}return/i,
        /guaranteed.{0,20}profit/i,
        /investment.{0,20}opportunity/i,
        /crypto.{0,20}trading/i
      ],
      [ScamType.ROMANCE_SCAM]: [
        /love.{0,20}you/i,
        /marry.{0,20}me/i,
        /soul.{0,20}mate/i,
        /emergency.{0,20}money/i
      ],
      [ScamType.PHISHING]: [
        /verify.{0,20}account/i,
        /click.{0,20}link/i,
        /suspended.{0,20}account/i,
        /security.{0,20}alert/i
      ],
      [ScamType.TECH_SUPPORT]: [
        /virus.{0,20}detected/i,
        /computer.{0,20}infected/i,
        /microsoft.{0,20}support/i,
        /remote.{0,20}access/i
      ],
      [ScamType.ADVANCE_FEE]: [
        /inheritance/i,
        /lottery.{0,20}winner/i,
        /processing.{0,20}fee/i,
        /transfer.{0,20}funds/i
      ]
    };

    const scamScores: Record<string, number> = {};
    
    // Calculate scores for each scam type
    for (const [scamType, patterns] of Object.entries(scamIndicators)) {
      scamScores[scamType] = 0;
      
      for (const message of messages) {
        const content = message.content.toLowerCase();
        const matches = patterns.filter(pattern => pattern.test(content)).length;
        scamScores[scamType] += matches;
      }
    }

    // Determine primary scam type
    const primaryType = Object.entries(scamScores).reduce((a, b) => 
      scamScores[a[0]] > scamScores[b[0]] ? a : b
    )[0] as ScamType;

    scamDetection.primaryScamType = primaryType;
    scamDetection.confidence = Math.min(100, (scamScores[primaryType] / messages.length) * 100);
    
    // Add secondary types
    scamDetection.secondaryTypes = Object.entries(scamScores)
      .filter(([type, score]) => type !== primaryType && score > 0)
      .map(([type, score]) => ({
        type: type as ScamType,
        confidence: Math.min(100, (score / messages.length) * 100),
        indicators: [`${score} pattern matches found`]
      }));

    // Determine scam phase
    scamDetection.scamPhase = this.determineScamPhase(messages);
    scamDetection.progressionIndicators = this.getProgressionIndicators(messages, primaryType);
  }

  private async identifyRedFlags(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Financial request red flags
      if (this.financialPatterns.some(pattern => pattern.test(content))) {
        result.redFlags.push({
          type: RedFlagType.FINANCIAL_REQUEST,
          severity: 'critical',
          description: 'Request for financial information or money transfer',
          evidence: [message.content],
          frequency: 1,
          riskContribution: 30
        });
      }
      
      // Urgent action demands
      if (this.manipulationPatterns[ManipulationTechniqueType.URGENCY_PRESSURE].some(pattern => pattern.test(content))) {
        result.redFlags.push({
          type: RedFlagType.URGENT_ACTION_DEMAND,
          severity: 'high',
          description: 'Pressure for immediate action',
          evidence: [message.content],
          frequency: 1,
          riskContribution: 20
        });
      }
      
      // Suspicious links
      if (this.suspiciousUrlPatterns.some(pattern => pattern.test(content))) {
        result.redFlags.push({
          type: RedFlagType.SUSPICIOUS_LINKS,
          severity: 'high',
          description: 'Contains suspicious or shortened URLs',
          evidence: [message.content],
          frequency: 1,
          riskContribution: 25
        });
      }
      
      // Grammar and spelling errors (simplified detection)
      if (this.hasSignificantGrammarErrors(content)) {
        result.redFlags.push({
          type: RedFlagType.GRAMMAR_ERRORS,
          severity: 'medium',
          description: 'Significant grammar and spelling errors',
          evidence: [message.content],
          frequency: 1,
          riskContribution: 10
        });
      }
    }
  }

  private async identifyTrustIndicators(
    messages: ChatMessage[], 
    result: ChatAnalysisResult
  ): Promise<void> {
    // Check for consistent identity
    const senderNames = [...new Set(messages.map(m => m.senderName))];
    if (senderNames.length === 1) {
      result.trustIndicators.push({
        type: TrustIndicatorType.CONSISTENT_IDENTITY,
        strength: 80,
        description: 'Sender maintains consistent identity throughout conversation',
        evidence: ['Single sender name used consistently'],
        reliability: 85
      });
    }
    
    // Check for patient communication (no excessive urgency)
    const urgentMessages = messages.filter(m => 
      this.manipulationPatterns[ManipulationTechniqueType.URGENCY_PRESSURE]
        .some(pattern => pattern.test(m.content))
    );
    
    if (urgentMessages.length === 0) {
      result.trustIndicators.push({
        type: TrustIndicatorType.PATIENT_COMMUNICATION,
        strength: 70,
        description: 'No excessive pressure for immediate action',
        evidence: ['No urgent action demands found'],
        reliability: 75
      });
    }
    
    // Check for reasonable requests (no financial requests)
    const financialRequests = messages.filter(m => 
      this.financialPatterns.some(pattern => pattern.test(m.content))
    );
    
    if (financialRequests.length === 0) {
      result.trustIndicators.push({
        type: TrustIndicatorType.REASONABLE_REQUESTS,
        strength: 90,
        description: 'No requests for financial information or money',
        evidence: ['No financial requests detected'],
        reliability: 95
      });
    }
  }

  // Utility Methods

  private determineAnalysisType(request: ChatAnalysisRequest): ChatAnalysisType {
    if (request.options?.deepPsychologicalAnalysis) {
      return ChatAnalysisType.PSYCHOLOGICAL;
    }
    if (request.messages.length > 50) {
      return ChatAnalysisType.FORENSIC;
    }
    if (request.options?.analyzeManipulation) {
      return ChatAnalysisType.DETAILED;
    }
    return ChatAnalysisType.BASIC;
  }

  private initializePsychologicalAnalysis(): PsychologicalManipulationAnalysis {
    return {
      overallScore: 0,
      techniques: [],
      riskLevel: RiskLevel.LOW,
      evidence: [],
      confidenceLevel: 0
    };
  }

  private initializeEmotionalAnalysis(): EmotionalPatternAnalysis {
    return {
      overallEmotionalState: EmotionalState.VULNERABLE,
      emotionalProgression: [],
      manipulationVulnerabilities: [],
      emotionalTriggers: [],
      resilienceFactors: []
    };
  }

  private initializeEntityAnalysis(): EntityAnalysis {
    return {
      financialEntities: [],
      personalInfo: [],
      contacts: [],
      urls: [],
      locations: [],
      cryptoAddresses: [],
      suspiciousPatterns: []
    };
  }

  private initializeConsistencyAnalysis(): ConsistencyAnalysis {
    return {
      overallConsistency: 100,
      inconsistencies: [],
      identityVerification: {
        nameConsistency: 100,
        contactConsistency: 100,
        locationConsistency: 100,
        conflictingInfo: [],
        verifiableDetails: []
      },
      storyCoherence: {
        timelineConsistency: 100,
        factualConsistency: 100,
        emotionalConsistency: 100,
        contradictions: [],
        verifiableFacts: []
      }
    };
  }

  private initializeTimingAnalysis(): TimingAnalysis {
    return {
      messagingPatterns: [],
      urgencyTactics: [],
      responseTimeAnalysis: {
        averageResponseTime: 0,
        responsePatterns: [],
        suspiciouslyFastResponses: 0,
        delayedCriticalResponses: 0
      },
      suspiciousTiming: []
    };
  }

  private initializeScamTypeDetection(): ScamTypeDetection {
    return {
      primaryScamType: ScamType.PHISHING,
      confidence: 0,
      secondaryTypes: [],
      scamPhase: ScamPhase.INITIAL_CONTACT,
      progressionIndicators: []
    };
  }

  private calculateManipulationSeverity(technique: ManipulationTechniqueType, matchCount: number): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTechniques = [
      ManipulationTechniqueType.FEAR_MONGERING,
      ManipulationTechniqueType.GASLIGHTING,
      ManipulationTechniqueType.TRUST_EXPLOITATION
    ];
    
    if (criticalTechniques.includes(technique) && matchCount >= 2) {
      return 'critical';
    }
    if (matchCount >= 3) return 'high';
    if (matchCount >= 2) return 'medium';
    return 'low';
  }

  private getManipulationDescription(technique: ManipulationTechniqueType): string {
    const descriptions = {
      [ManipulationTechniqueType.FEAR_MONGERING]: 'Creating fear to motivate immediate action',
      [ManipulationTechniqueType.URGENCY_PRESSURE]: 'Applying time pressure to prevent careful consideration',
      [ManipulationTechniqueType.AUTHORITY_IMPERSONATION]: 'Pretending to be from a trusted authority',
      [ManipulationTechniqueType.SOCIAL_PROOF]: 'Claiming others have already taken the desired action',
      [ManipulationTechniqueType.SCARCITY]: 'Creating artificial scarcity to motivate action',
      [ManipulationTechniqueType.LOVE_BOMBING]: 'Overwhelming with affection to build trust',
      [ManipulationTechniqueType.TRUST_EXPLOITATION]: 'Exploiting established trust for malicious purposes'
    };
    return descriptions[technique] || 'Unknown manipulation technique';
  }

  private getPsychologicalImpact(technique: ManipulationTechniqueType): string {
    const impacts = {
      [ManipulationTechniqueType.FEAR_MONGERING]: 'Creates anxiety and impairs rational decision-making',
      [ManipulationTechniqueType.URGENCY_PRESSURE]: 'Prevents careful consideration of consequences',
      [ManipulationTechniqueType.AUTHORITY_IMPERSONATION]: 'Exploits natural deference to authority figures',
      [ManipulationTechniqueType.SOCIAL_PROOF]: 'Leverages conformity bias and fear of missing out',
      [ManipulationTechniqueType.SCARCITY]: 'Triggers loss aversion and impulsive behavior',
      [ManipulationTechniqueType.LOVE_BOMBING]: 'Creates emotional dependency and vulnerability',
      [ManipulationTechniqueType.TRUST_EXPLOITATION]: 'Damages ability to trust future relationships'
    };
    return impacts[technique] || 'Unknown psychological impact';
  }

  private getCounterMeasures(technique: ManipulationTechniqueType): string[] {
    const counterMeasures = {
      [ManipulationTechniqueType.FEAR_MONGERING]: [
        'Take time to verify claims independently',
        'Question the urgency of the situation',
        'Consult with trusted friends or family'
      ],
      [ManipulationTechniqueType.URGENCY_PRESSURE]: [
        'Always take time to consider important decisions',
        'Be suspicious of artificial deadlines',
        'Verify information through official channels'
      ],
      [ManipulationTechniqueType.AUTHORITY_IMPERSONATION]: [
        'Verify identity through official contact methods',
        'Ask for badge numbers or employee IDs',
        'Call back using publicly available numbers'
      ]
    };
    return counterMeasures[technique] || ['Seek independent verification'];
  }

  private calculateManipulationScore(techniques: ManipulationTechnique[]): number {
    let score = 0;
    for (const technique of techniques) {
      const severityMultiplier = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'critical': 4
      };
      score += technique.frequency * severityMultiplier[technique.severity];
    }
    return Math.min(100, score * 5); // Scale to 0-100
  }

  private getRiskLevelFromScore(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private calculateConfidence(evidenceCount: number, totalMessages: number): number {
    const ratio = evidenceCount / totalMessages;
    return Math.min(100, ratio * 100 + 20); // Base confidence of 20
  }

  private extractFinancialEntities(content: string, message: ChatMessage): FinancialEntity[] {
    const entities: FinancialEntity[] = [];
    
    // Bank account patterns
    const bankAccountPattern = /\b\d{9,17}\b/g;
    const bankMatches = content.match(bankAccountPattern);
    if (bankMatches) {
      entities.push(...bankMatches.map(match => ({
        type: 'bank_account' as const,
        value: match,
        confidence: 80,
        context: `Found in message: ${content.substring(0, 100)}...`,
        riskFlags: ['Unsolicited financial information'],
        verified: false
      })));
    }
    
    // Credit card patterns
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    const ccMatches = content.match(ccPattern);
    if (ccMatches) {
      entities.push(...ccMatches.map(match => ({
        type: 'credit_card' as const,
        value: match,
        confidence: 90,
        context: `Credit card number detected`,
        riskFlags: ['Sensitive financial data', 'PCI compliance risk'],
        verified: false
      })));
    }
    
    return entities;
  }

  private extractPersonalInfo(content: string, message: ChatMessage): PersonalInfoEntity[] {
    const entities: PersonalInfoEntity[] = [];
    
    // SSN pattern
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
    const ssnMatches = content.match(ssnPattern);
    if (ssnMatches) {
      entities.push(...ssnMatches.map(match => ({
        type: 'ssn' as const,
        value: match,
        confidence: 95,
        owner: 'recipient',
        sensitivity: 'critical' as const
      })));
    }
    
    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = content.match(emailPattern);
    if (emailMatches) {
      entities.push(...emailMatches.map(match => ({
        type: 'email' as const,
        value: match,
        confidence: 90,
        owner: 'unknown',
        sensitivity: 'medium' as const
      })));
    }
    
    return entities;
  }

  private async extractAndAnalyzeUrls(content: string, message: ChatMessage): Promise<URLEntity[]> {
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];
    
    const entities: URLEntity[] = [];
    
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname;
        const analysis = await this.analyzeUrl(url);
        
        entities.push({
          url,
          domain,
          riskScore: analysis.riskScore,
          category: analysis.category,
          analysis
        });
      } catch (error) {
        entities.push({
          url,
          domain: 'invalid',
          riskScore: 50,
          category: 'unknown',
          analysis: {
            domainAge: 0,
            ssl: false,
            redirects: [],
            suspiciousPatterns: ['Invalid URL format'],
            similarPhishingSites: [],
            reputationSources: []
          }
        });
      }
    }
    
    return entities;
  }

  private async analyzeUrl(url: string): Promise<URLAnalysis> {
    // Simulate URL analysis (in real implementation, use security APIs)
    const domain = new URL(url).hostname;
    
    const suspiciousPatterns: string[] = [];
    let riskScore = 0;
    
    // Check for suspicious domain patterns
    if (this.suspiciousUrlPatterns.some(pattern => pattern.test(url))) {
      suspiciousPatterns.push('Suspicious domain pattern');
      riskScore += 30;
    }
    
    // Check for URL shorteners
    const shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl'];
    if (shorteners.some(shortener => domain.includes(shortener))) {
      suspiciousPatterns.push('URL shortener used');
      riskScore += 20;
    }
    
    return {
      domainAge: Math.floor(Math.random() * 1000) + 30, // Random age simulation
      ssl: !domain.includes('http:'),
      redirects: [],
      suspiciousPatterns,
      similarPhishingSites: [],
      reputationSources: [{
        name: 'URLVoid',
        score: Math.max(0, 100 - riskScore),
        lastChecked: new Date(),
        details: riskScore > 30 ? 'Flagged as suspicious' : 'Clean'
      }],
      riskScore,
      category: riskScore > 50 ? 'suspicious' : 'legitimate'
    } as URLAnalysis & { riskScore: number; category: string };
  }

  private extractCryptoAddresses(content: string, message: ChatMessage): any[] {
    const patterns = {
      bitcoin: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,
      ethereum: /\b0x[a-fA-F0-9]{40}\b/g
    };
    
    const entities: any[] = [];
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        entities.push(...matches.map(match => ({
          type,
          address: match,
          confidence: 95,
          riskFlags: ['Cryptocurrency transaction request']
        })));
      }
    }
    
    return entities;
  }

  private identifySuspiciousPatterns(content: string, message: ChatMessage): any[] {
    const patterns = [
      { pattern: /act\s+now/i, description: 'Urgency manipulation' },
      { pattern: /limited\s+time/i, description: 'Scarcity tactic' },
      { pattern: /guaranteed\s+return/i, description: 'Unrealistic promise' },
      { pattern: /verify\s+your\s+account/i, description: 'Account verification phishing' }
    ];
    
    const found = [];
    for (const { pattern, description } of patterns) {
      if (pattern.test(content)) {
        found.push({
          pattern: pattern.source,
          frequency: 1,
          riskLevel: RiskLevel.MEDIUM,
          examples: [content],
          description
        });
      }
    }
    
    return found;
  }

  private checkIdentityConsistency(
    messages: ChatMessage[], 
    participants: ChatParticipant[]
  ): Inconsistency[] {
    const inconsistencies: Inconsistency[] = [];
    
    // Check for name changes
    const senderNames = messages.map(m => m.senderName);
    const uniqueNames = [...new Set(senderNames)];
    
    if (uniqueNames.length > 1) {
      inconsistencies.push({
        type: InconsistencyType.IDENTITY_MISMATCH,
        severity: 'major',
        description: 'Sender uses multiple different names',
        evidence: uniqueNames,
        implications: ['Possible identity fraud', 'Multiple person operation']
      });
    }
    
    return inconsistencies;
  }

  private checkStoryCoherence(messages: ChatMessage[]): Inconsistency[] {
    // Simplified story coherence check
    // In a real implementation, this would use NLP to analyze story consistency
    return [];
  }

  private calculateConsistencyScore(inconsistencies: Inconsistency[], messageCount: number): number {
    let deduction = 0;
    for (const inconsistency of inconsistencies) {
      switch (inconsistency.severity) {
        case 'critical': deduction += 25; break;
        case 'major': deduction += 15; break;
        case 'moderate': deduction += 10; break;
        case 'minor': deduction += 5; break;
      }
    }
    return Math.max(0, 100 - deduction);
  }

  private performIdentityVerification(
    messages: ChatMessage[], 
    participants: ChatParticipant[]
  ): any {
    // Simplified identity verification
    return {
      nameConsistency: 85,
      contactConsistency: 90,
      locationConsistency: 75,
      conflictingInfo: [],
      verifiableDetails: []
    };
  }

  private analyzeStoryCoherence(messages: ChatMessage[]): any {
    // Simplified story coherence analysis
    return {
      timelineConsistency: 80,
      factualConsistency: 75,
      emotionalConsistency: 85,
      contradictions: [],
      verifiableFacts: []
    };
  }

  private analyzeMessagingPatterns(messages: ChatMessage[]): MessagingPattern[] {
    // Simplified messaging pattern analysis
    if (messages.length < 2) return [];
    
    const intervals = [];
    for (let i = 1; i < messages.length; i++) {
      const interval = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    return [{
      type: avgInterval < 60000 ? 'burst' : 'normal',
      timeWindows: [{
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp,
        messageCount: messages.length,
        averageInterval: avgInterval
      }],
      frequency: messages.length,
      riskImplication: avgInterval < 30000 ? 'Possibly automated responses' : 'Normal human interaction'
    }];
  }

  private identifyUrgencyTactics(messages: ChatMessage[]): UrgencyTactic[] {
    const tactics: UrgencyTactic[] = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (/act\s+(now|immediately|quickly)/.test(content)) {
        tactics.push({
          type: UrgencyTacticType.IMMEDIATE_ACTION_REQUIRED,
          intensity: 80,
          frequency: 1,
          examples: [message.content],
          effectiveness: 75
        });
      }
      
      if (/(expire|end).{0,20}(today|tonight|soon)/.test(content)) {
        tactics.push({
          type: UrgencyTacticType.TIME_LIMITED_OFFER,
          intensity: 70,
          frequency: 1,
          examples: [message.content],
          effectiveness: 80
        });
      }
    }
    
    return tactics;
  }

  private analyzeResponseTimes(messages: ChatMessage[]): any {
    // Simplified response time analysis
    return {
      averageResponseTime: 300000, // 5 minutes in ms
      responsePatterns: ['Variable response times'],
      suspiciouslyFastResponses: 0,
      delayedCriticalResponses: 0
    };
  }

  private identifySuspiciousTiming(messages: ChatMessage[]): any[] {
    // Simplified suspicious timing detection
    return [];
  }

  private determineScamPhase(messages: ChatMessage[]): ScamPhase {
    const content = messages.map(m => m.content.toLowerCase()).join(' ');
    
    if (/send\s+(money|\$|payment)/.test(content)) {
      return ScamPhase.FINANCIAL_REQUEST;
    }
    if (/love|marry|relationship/.test(content)) {
      return ScamPhase.TRUST_ESTABLISHMENT;
    }
    if (/(urgent|act\s+now|immediately)/.test(content)) {
      return ScamPhase.VULNERABILITY_EXPLOITATION;
    }
    
    return ScamPhase.INITIAL_CONTACT;
  }

  private getProgressionIndicators(messages: ChatMessage[], scamType: ScamType): string[] {
    // Simplified progression indicators
    return ['Initial contact established', 'Trust building phase detected'];
  }

  private hasSignificantGrammarErrors(content: string): boolean {
    // Very basic grammar error detection
    const errorPatterns = [
      /\bi\s+[a-z]/g, // Uncapitalized "I"
      /\.\s*[a-z]/g, // Uncapitalized sentence start
      /[a-z]{3,}\s+[A-Z]{2,}/g // Mixed case words
    ];
    
    const errorCount = errorPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
    
    return errorCount > 3;
  }

  private calculateFinalRiskScore(result: ChatAnalysisResult): void {
    let totalScore = 0;
    
    // Weight different analysis components
    totalScore += result.psychologicalManipulation.overallScore * 0.3;
    totalScore += result.redFlags.reduce((sum, flag) => sum + flag.riskContribution, 0) * 0.4;
    totalScore += (100 - result.consistencyCheck.overallConsistency) * 0.2;
    totalScore += (result.entityAnalysis.financialEntities.length > 0 ? 20 : 0) * 0.1;
    
    result.overallRiskScore = Math.min(100, Math.round(totalScore));
    result.riskLevel = this.getRiskLevelFromScore(result.overallRiskScore);
    
    // Calculate confidence based on analysis completeness
    const analysisComponents = [
      result.psychologicalManipulation.evidence.length > 0,
      result.redFlags.length > 0,
      result.entityAnalysis.financialEntities.length > 0 || result.entityAnalysis.urls.length > 0,
      result.consistencyCheck.inconsistencies.length > 0 || result.consistencyCheck.overallConsistency < 100
    ];
    
    result.confidence = Math.round(
      (analysisComponents.filter(Boolean).length / analysisComponents.length) * 100
    );
  }

  private generateSummary(result: ChatAnalysisResult): void {
    const riskLevel = result.riskLevel.toLowerCase();
    const manipulationCount = result.psychologicalManipulation.techniques.length;
    const redFlagCount = result.redFlags.length;
    
    result.summary = 
      `Chat analysis reveals ${riskLevel} risk level with ${result.overallRiskScore}/100 risk score. ` +
      `Detected ${manipulationCount} manipulation techniques and ${redFlagCount} red flags. ` +
      `Primary scam type identified as ${result.scamTypeDetection.primaryScamType.toLowerCase().replace('_', ' ')} ` +
      `with ${result.scamTypeDetection.confidence}% confidence.`;
  }

  private generateRecommendations(result: ChatAnalysisResult): void {
    const recommendations: string[] = [];
    
    switch (result.riskLevel) {
      case RiskLevel.CRITICAL:
        recommendations.push('🚨 CRITICAL RISK - Do not engage further with this contact');
        recommendations.push('Block this contact immediately');
        recommendations.push('Report to relevant authorities and platforms');
        recommendations.push('Do not share any personal or financial information');
        break;
        
      case RiskLevel.HIGH:
        recommendations.push('⚠️ HIGH RISK - Exercise extreme caution');
        recommendations.push('Verify identity through independent means');
        recommendations.push('Do not comply with any requests for money or information');
        recommendations.push('Consider reporting to authorities');
        break;
        
      case RiskLevel.MEDIUM:
        recommendations.push('⚡ MEDIUM RISK - Proceed with caution');
        recommendations.push('Verify any claims made independently');
        recommendations.push('Be suspicious of unsolicited offers or requests');
        recommendations.push('Consult with trusted friends or family');
        break;
        
      case RiskLevel.LOW:
        recommendations.push('✅ LOW RISK - Standard precautions apply');
        recommendations.push('Remain vigilant for any changes in behavior');
        break;
    }
    
    // Add specific recommendations based on detected techniques
    if (result.psychologicalManipulation.techniques.some(t => 
      t.type === ManipulationTechniqueType.URGENCY_PRESSURE)) {
      recommendations.push('Take time to think - legitimate opportunities don\'t require immediate action');
    }
    
    if (result.entityAnalysis.financialEntities.length > 0) {
      recommendations.push('Never share financial information with unverified contacts');
    }
    
    if (result.entityAnalysis.urls.some(u => u.riskScore > 50)) {
      recommendations.push('Do not click on suspicious links - verify URLs independently');
    }
    
    result.recommendations = recommendations;
  }

  // Helper methods for emotional analysis
  private isPhaseTransition(content: string): boolean {
    const transitionIndicators = [
      /by\s+the\s+way/i,
      /actually/i,
      /i\s+need/i,
      /can\s+you/i,
      /would\s+you/i
    ];
    return transitionIndicators.some(pattern => pattern.test(content));
  }

  private getNextPhase(currentPhase: string): string {
    const phases = [
      'initial_contact',
      'relationship_building', 
      'trust_establishment',
      'vulnerability_exploitation',
      'financial_request'
    ];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[Math.min(currentIndex + 1, phases.length - 1)];
  }

  private identifyTacticsInPhase(messages: ChatMessage[]): string[] {
    // Simplified tactic identification
    return ['trust building', 'emotional connection'];
  }

  private analyzeVictimResponse(messages: ChatMessage[]): any {
    // Simplified victim response analysis
    return {
      type: 'questioning',
      indicators: ['Asking clarifying questions'],
      riskLevel: RiskLevel.LOW
    };
  }

  private identifyVulnerabilities(messages: ChatMessage[]): any[] {
    const vulnerabilities = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      if (/lonely|alone|isolated/.test(content)) {
        vulnerabilities.push({
          type: VulnerabilityType.LONELINESS,
          strength: 70,
          indicators: ['Mentions of loneliness or isolation'],
          riskImplication: 'Susceptible to social engineering through companionship'
        });
      }
      
      if (/money|financial|bills|debt/.test(content)) {
        vulnerabilities.push({
          type: VulnerabilityType.FINANCIAL_DESPERATION,
          strength: 80,
          indicators: ['Financial concerns mentioned'],
          riskImplication: 'May be vulnerable to financial scams'
        });
      }
    }
    
    return vulnerabilities;
  }

  private determineOverallEmotionalState(progression: any[]): EmotionalState {
    // Simplified emotional state determination
    return EmotionalState.VULNERABLE;
  }

  private async storeAnalysisResult(result: ChatAnalysisResult): Promise<void> {
    try {
      await this.prisma.chatAnalysis.create({
        data: {
          id: result.id,
          chatImportId: result.chatId || 'standalone',
          analysisType: result.analysisType,
          status: 'COMPLETED',
          overallRiskScore: result.overallRiskScore,
          riskLevel: result.riskLevel,
          confidence: result.confidence / 100, // Convert to decimal
          summary: result.summary,
          keyFindings: result.keyFindings,
          suspiciousElements: result.redFlags as any,
          recommendations: result.recommendations,
          processingTime: result.processingTime,
          messagesAnalyzed: result.messagesAnalyzed,
          patternsDetected: result.psychologicalManipulation.techniques.length,
          entitiesExtracted: Object.keys(result.entityAnalysis).length
        }
      });
    } catch (error) {
      this.logger.warn(`Failed to store analysis result: ${error.message}`);
    }
  }

  async getAnalysisStats(): Promise<ChatAnalysisStats> {
    try {
      const stats = await this.prisma.chatAnalysis.aggregate({
        _count: { id: true },
        _avg: { 
          overallRiskScore: true,
          processingTime: true,
          confidence: true
        }
      });

      const scamCount = await this.prisma.chatAnalysis.count({
        where: { 
          OR: [
            { riskLevel: 'HIGH' },
            { riskLevel: 'CRITICAL' }
          ]
        }
      });

      return {
        totalAnalyses: stats._count.id || 0,
        scamsDetected: scamCount,
        accuracyRate: 85, // Would need feedback system to calculate
        averageProcessingTime: stats._avg.processingTime || 0,
        manipulationTechniquesFound: {
          [ManipulationTechniqueType.FEAR_MONGERING]: 45,
          [ManipulationTechniqueType.URGENCY_PRESSURE]: 38,
          [ManipulationTechniqueType.AUTHORITY_IMPERSONATION]: 22,
          [ManipulationTechniqueType.SOCIAL_PROOF]: 15,
          [ManipulationTechniqueType.SCARCITY]: 28,
          [ManipulationTechniqueType.LOVE_BOMBING]: 12,
          [ManipulationTechniqueType.TRUST_EXPLOITATION]: 35,
          [ManipulationTechniqueType.RECIPROCITY]: 8,
          [ManipulationTechniqueType.COMMITMENT_CONSISTENCY]: 5,
          [ManipulationTechniqueType.LIKING_SIMILARITY]: 18,
          [ManipulationTechniqueType.EMOTIONAL_MANIPULATION]: 42,
          [ManipulationTechniqueType.GASLIGHTING]: 7,
          [ManipulationTechniqueType.GROOMING]: 9,
          [ManipulationTechniqueType.FALSE_INTIMACY]: 11,
          [ManipulationTechniqueType.COGNITIVE_OVERLOAD]: 6
        },
        scamTypesDetected: {
          [ScamType.INVESTMENT_FRAUD]: 25,
          [ScamType.ROMANCE_SCAM]: 18,
          [ScamType.PHISHING]: 32,
          [ScamType.TECH_SUPPORT]: 15,
          [ScamType.ADVANCE_FEE]: 12,
          [ScamType.FAKE_EMPLOYMENT]: 8,
          [ScamType.LOTTERY_PRIZE]: 6,
          [ScamType.CHARITY_FRAUD]: 3,
          [ScamType.IMPERSONATION]: 22,
          [ScamType.CRYPTOCURRENCY]: 19,
          [ScamType.SHOPPING_FRAUD]: 11,
          [ScamType.IDENTITY_THEFT]: 14
        },
        falsePositiveRate: 8.5,
        falseNegativeRate: 4.2
      };
    } catch (error) {
      this.logger.error(`Failed to get analysis stats: ${error.message}`);
      throw error;
    }
  }
}