import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  ContactVerificationRequest,
  ContactVerificationResult,
  ContactType,
  RiskLevel,
  VerificationSource,
  ScammerDatabaseResult,
  ContactAdditionalInfo,
  PhoneVerificationInfo,
  EmailVerificationInfo,
  NameVerificationInfo,
  VerificationFlag,
  VerificationFlagType,
  ContactVerificationConfig,
  ContactVerificationStats
} from './types/contact-verification.types';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class ContactVerificationService {
  private readonly logger = new Logger(ContactVerificationService.name);
  private readonly config: ContactVerificationConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      enabledSources: ['truecaller', 'numverify', 'hunter', 'scammerinfo', 'fbi_ic3'],
      timeoutMs: 10000,
      maxRetries: 3,
      cacheTtlHours: 24,
      apiKeys: {
        truecaller: this.configService.get('TRUECALLER_API_KEY', 'demo_truecaller_key'),
        numverify: this.configService.get('NUMVERIFY_API_KEY', 'demo_numverify_key'),
        clearbit: this.configService.get('CLEARBIT_API_KEY', 'demo_clearbit_key'),
        hunter: this.configService.get('HUNTER_API_KEY', 'demo_hunter_key'),
        emailRep: this.configService.get('EMAILREP_API_KEY', 'demo_emailrep_key'),
        scammerInfo: this.configService.get('SCAMMERINFO_API_KEY', 'demo_scammerinfo_key'),
        fbi_ic3: this.configService.get('FBI_IC3_API_KEY', 'demo_fbi_key'),
        ftc_sentinel: this.configService.get('FTC_SENTINEL_API_KEY', 'demo_ftc_key'),
      }
    };
  }

  async verifyContact(request: ContactVerificationRequest): Promise<ContactVerificationResult> {
    this.logger.log(`Starting contact verification for ${request.type}: ${request.value}`);
    
    const startTime = Date.now();
    const cacheKey = `contact_verification:${request.type}:${request.value}`;
    
    try {
      // Check cache first
      const cachedResult = await this.redis.get(cacheKey);
      if (cachedResult) {
        this.logger.log('Returning cached verification result');
        return JSON.parse(cachedResult);
      }

      // Perform verification
      const result = await this.performVerification(request);
      
      // Cache result
      await this.redis.setex(
        cacheKey,
        this.config.cacheTtlHours * 3600,
        JSON.stringify(result)
      );

      // Log metrics
      const processingTime = Date.now() - startTime;
      this.logger.log(`Contact verification completed in ${processingTime}ms`);
      
      // Store in database for analytics
      await this.storeVerificationResult(result);
      
      return result;

    } catch (error) {
      this.logger.error(`Contact verification failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Contact verification failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async performVerification(request: ContactVerificationRequest): Promise<ContactVerificationResult> {
    const verificationId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize result structure
    const result: ContactVerificationResult = {
      id: verificationId,
      contactType: request.type as ContactType,
      contactValue: request.value,
      isScammer: false,
      riskScore: 0,
      riskLevel: RiskLevel.LOW,
      confidence: 0,
      verificationSources: [],
      scammerDatabases: [],
      additionalInfo: {
        crossReferences: [],
        socialMediaPresence: [],
        behaviorPatterns: []
      },
      recommendations: [],
      lastVerified: new Date(),
      flags: []
    };

    // Verify based on contact type
    switch (request.type) {
      case ContactType.PHONE:
        await this.verifyPhone(request.value, result);
        break;
      case ContactType.EMAIL:
        await this.verifyEmail(request.value, result);
        break;
      case ContactType.NAME:
        await this.verifyName(request.value, result);
        break;
      default:
        throw new Error(`Unsupported contact type: ${request.type}`);
    }

    // Check against scammer databases
    await this.checkScammerDatabases(request.value, request.type, result);
    
    // Calculate final risk assessment
    this.calculateRiskAssessment(result);
    
    // Generate recommendations
    this.generateRecommendations(result);

    return result;
  }

  private async verifyPhone(phoneNumber: string, result: ContactVerificationResult): Promise<void> {
    const phoneInfo: PhoneVerificationInfo = {
      isValid: false,
      countryCode: '',
      lineType: 'unknown',
      isPortedNumber: false,
      reputation: {
        spamScore: 0,
        teleMarketingLikelihood: 0,
        fraudLikelihood: 0
      }
    };

    try {
      // Validate phone format
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      phoneInfo.isValid = phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''));

      if (phoneInfo.isValid) {
        // Extract country code
        phoneInfo.countryCode = this.extractCountryCode(phoneNumber);
        
        // Check with Truecaller-like service (simulated)
        const truecallerResult = await this.checkTruecallerAPI(phoneNumber);
        result.verificationSources.push(truecallerResult);
        
        if (truecallerResult.status === 'flagged') {
          phoneInfo.reputation.spamScore = 85;
          phoneInfo.reputation.fraudLikelihood = 90;
          result.flags.push({
            type: VerificationFlagType.KNOWN_SCAMMER,
            severity: 'high',
            description: 'Phone number flagged by multiple users as spam/fraud',
            evidence: [`Truecaller reports: ${truecallerResult.details}`],
            actionRecommended: 'Block this number immediately'
          });
        }

        // Check with Numverify-like service
        const numverifyResult = await this.checkNumverifyAPI(phoneNumber);
        result.verificationSources.push(numverifyResult);
        
        if (numverifyResult.status === 'verified') {
          phoneInfo.carrier = 'Carrier Info Available';
          phoneInfo.lineType = this.determineLineType(phoneNumber);
          phoneInfo.location = {
            country: this.getCountryFromCode(phoneInfo.countryCode)
          };
        }

        // Check for VOIP/burner patterns
        if (this.isLikelyVoipOrBurner(phoneNumber)) {
          result.flags.push({
            type: VerificationFlagType.VOIP_MASKING,
            severity: 'medium',
            description: 'Phone number appears to be VOIP or burner phone',
            evidence: ['Number pattern analysis', 'Carrier information'],
            actionRecommended: 'Exercise caution - verify identity through other means'
          });
          phoneInfo.reputation.fraudLikelihood += 30;
        }
      }

      result.additionalInfo.phoneInfo = phoneInfo;

    } catch (error) {
      this.logger.warn(`Phone verification failed: ${error.message}`);
      result.verificationSources.push({
        name: 'Phone Verification',
        lastChecked: new Date(),
        status: 'error',
        details: error.message,
        confidence: 0
      });
    }
  }

  private async verifyEmail(email: string, result: ContactVerificationResult): Promise<void> {
    const emailInfo: EmailVerificationInfo = {
      isValid: false,
      isDeliverable: false,
      domain: '',
      disposableEmail: false,
      roleAccount: false,
      reputation: {
        spamScore: 0,
        phishingLikelihood: 0,
        compromisedAccount: false
      },
      breachHistory: []
    };

    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emailInfo.isValid = emailRegex.test(email);
      
      if (emailInfo.isValid) {
        emailInfo.domain = email.split('@')[1];
        
        // Check with Hunter.io-like service
        const hunterResult = await this.checkHunterAPI(email);
        result.verificationSources.push(hunterResult);
        
        if (hunterResult.status === 'verified') {
          emailInfo.isDeliverable = true;
        }

        // Check for disposable email
        emailInfo.disposableEmail = await this.isDisposableEmail(emailInfo.domain);
        
        if (emailInfo.disposableEmail) {
          result.flags.push({
            type: VerificationFlagType.DISPOSABLE_CONTACT,
            severity: 'high',
            description: 'Email uses disposable/temporary email service',
            evidence: [`Domain: ${emailInfo.domain}`],
            actionRecommended: 'Request alternative contact method'
          });
        }

        // Check role account patterns
        emailInfo.roleAccount = this.isRoleAccount(email);

        // Check EmailRep for reputation
        const emailRepResult = await this.checkEmailRepAPI(email);
        result.verificationSources.push(emailRepResult);
        
        if (emailRepResult.status === 'flagged') {
          emailInfo.reputation.spamScore = 95;
          emailInfo.reputation.phishingLikelihood = 80;
          result.flags.push({
            type: VerificationFlagType.SUSPICIOUS_PATTERN,
            severity: 'high',
            description: 'Email associated with suspicious activities',
            evidence: [`EmailRep analysis: ${emailRepResult.details}`],
            actionRecommended: 'Verify sender identity through alternative means'
          });
        }

        // Check domain age
        emailInfo.domainAge = await this.getDomainAge(emailInfo.domain);
        
        if (emailInfo.domainAge && emailInfo.domainAge < 30) {
          result.flags.push({
            type: VerificationFlagType.RAPID_ACCOUNT_CREATION,
            severity: 'medium',
            description: 'Email domain registered very recently',
            evidence: [`Domain age: ${emailInfo.domainAge} days`],
            actionRecommended: 'Exercise increased caution'
          });
        }

        // Simulate breach history check
        emailInfo.breachHistory = await this.checkBreachHistory(email);
        
        if (emailInfo.breachHistory.length > 0) {
          emailInfo.reputation.compromisedAccount = true;
          result.flags.push({
            type: VerificationFlagType.COMPROMISED_ACCOUNT,
            severity: 'medium',
            description: 'Email found in data breaches',
            evidence: emailInfo.breachHistory.map(b => b.breachName),
            actionRecommended: 'Verify current account security status'
          });
        }
      }

      result.additionalInfo.emailInfo = emailInfo;

    } catch (error) {
      this.logger.warn(`Email verification failed: ${error.message}`);
      result.verificationSources.push({
        name: 'Email Verification',
        lastChecked: new Date(),
        status: 'error',
        details: error.message,
        confidence: 0
      });
    }
  }

  private async verifyName(name: string, result: ContactVerificationResult): Promise<void> {
    const nameInfo: NameVerificationInfo = {
      commonName: false,
      associatedScams: [],
      publicRecords: []
    };

    try {
      // Check if it's a common name
      nameInfo.commonName = await this.isCommonName(name);
      
      // Gender prediction (simplified)
      nameInfo.genderPrediction = this.predictGender(name);
      
      // Age estimation (very basic)
      nameInfo.ageEstimate = this.estimateAge(name);

      // Check for known scammer names
      nameInfo.associatedScams = await this.checkScammerNames(name);
      
      if (nameInfo.associatedScams.length > 0) {
        result.flags.push({
          type: VerificationFlagType.KNOWN_SCAMMER,
          severity: 'critical',
          description: 'Name associated with known scam activities',
          evidence: nameInfo.associatedScams,
          actionRecommended: 'Do not proceed - high risk of scam'
        });
      }

      // Public records check (simulated)
      nameInfo.publicRecords = await this.checkPublicRecords(name);
      
      const criminalRecords = nameInfo.publicRecords.filter(r => r.type === 'criminal');
      if (criminalRecords.length > 0) {
        result.flags.push({
          type: VerificationFlagType.SUSPICIOUS_PATTERN,
          severity: 'high',
          description: 'Name associated with criminal records',
          evidence: criminalRecords.map(r => r.description),
          actionRecommended: 'Investigate further before proceeding'
        });
      }

      result.additionalInfo.nameInfo = nameInfo;

    } catch (error) {
      this.logger.warn(`Name verification failed: ${error.message}`);
      result.verificationSources.push({
        name: 'Name Verification',
        lastChecked: new Date(),
        status: 'error',
        details: error.message,
        confidence: 0
      });
    }
  }

  private async checkScammerDatabases(
    contactValue: string, 
    contactType: ContactType, 
    result: ContactVerificationResult
  ): Promise<void> {
    const databases = [
      'FBI IC3 Database',
      'FTC Sentinel Network',
      'ScammerInfo',
      'Scam.com',
      'WhoCalledMe'
    ];

    for (const dbName of databases) {
      try {
        const dbResult = await this.queryScammerDatabase(dbName, contactValue, contactType);
        result.scammerDatabases.push(dbResult);
        
        if (dbResult.foundMatch && dbResult.matchDetails) {
          result.flags.push({
            type: VerificationFlagType.MULTIPLE_REPORTS,
            severity: 'critical',
            description: `Found in ${dbName} with ${dbResult.matchDetails.reportCount} reports`,
            evidence: [
              `First reported: ${dbResult.matchDetails.firstReported}`,
              `Scam types: ${dbResult.matchDetails.scamTypes.join(', ')}`,
              `Victim count: ${dbResult.matchDetails.victimCount || 'Unknown'}`
            ],
            actionRecommended: 'Do not engage - confirmed scammer'
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to check ${dbName}: ${error.message}`);
        result.scammerDatabases.push({
          databaseName: dbName,
          foundMatch: false,
          confidence: 0
        });
      }
    }
  }

  private calculateRiskAssessment(result: ContactVerificationResult): void {
    let riskScore = 0;
    let confidenceScore = 0;
    
    // Calculate risk based on flags
    for (const flag of result.flags) {
      switch (flag.severity) {
        case 'critical':
          riskScore += 30;
          break;
        case 'high':
          riskScore += 20;
          break;
        case 'medium':
          riskScore += 10;
          break;
        case 'low':
          riskScore += 5;
          break;
      }
    }

    // Calculate risk from scammer database matches
    for (const db of result.scammerDatabases) {
      if (db.foundMatch) {
        riskScore += 25;
        confidenceScore += db.confidence;
      }
    }

    // Calculate confidence from verification sources
    const validSources = result.verificationSources.filter(s => s.status !== 'error');
    if (validSources.length > 0) {
      confidenceScore = validSources.reduce((sum, source) => sum + source.confidence, 0) / validSources.length;
    }

    // Apply additional risk factors based on contact type
    if (result.additionalInfo.phoneInfo?.reputation) {
      riskScore += result.additionalInfo.phoneInfo.reputation.fraudLikelihood * 0.3;
    }
    
    if (result.additionalInfo.emailInfo?.reputation) {
      riskScore += result.additionalInfo.emailInfo.reputation.phishingLikelihood * 0.3;
    }

    // Cap risk score at 100
    result.riskScore = Math.min(100, Math.round(riskScore));
    result.confidence = Math.min(100, Math.round(confidenceScore));

    // Determine risk level
    if (result.riskScore >= 80) {
      result.riskLevel = RiskLevel.CRITICAL;
      result.isScammer = true;
    } else if (result.riskScore >= 60) {
      result.riskLevel = RiskLevel.HIGH;
      result.isScammer = true;
    } else if (result.riskScore >= 30) {
      result.riskLevel = RiskLevel.MEDIUM;
    } else {
      result.riskLevel = RiskLevel.LOW;
    }
  }

  private generateRecommendations(result: ContactVerificationResult): void {
    const recommendations: string[] = [];

    switch (result.riskLevel) {
      case RiskLevel.CRITICAL:
        recommendations.push('🚨 DO NOT ENGAGE - Confirmed high-risk contact');
        recommendations.push('Block this contact immediately');
        recommendations.push('Report to relevant authorities if contacted');
        break;
      
      case RiskLevel.HIGH:
        recommendations.push('⚠️ HIGH RISK - Avoid engagement');
        recommendations.push('If contact is necessary, verify identity through independent means');
        recommendations.push('Never share personal or financial information');
        break;
      
      case RiskLevel.MEDIUM:
        recommendations.push('⚡ MEDIUM RISK - Exercise caution');
        recommendations.push('Verify identity before proceeding');
        recommendations.push('Be skeptical of unsolicited offers or requests');
        break;
      
      case RiskLevel.LOW:
        recommendations.push('✅ Low risk detected');
        recommendations.push('Standard precautions apply');
        break;
    }

    // Add specific recommendations based on flags
    const flagTypes = result.flags.map(f => f.type);
    
    if (flagTypes.includes(VerificationFlagType.DISPOSABLE_CONTACT)) {
      recommendations.push('Request alternative, permanent contact information');
    }
    
    if (flagTypes.includes(VerificationFlagType.VOIP_MASKING)) {
      recommendations.push('Be aware that caller ID may be spoofed');
    }
    
    if (flagTypes.includes(VerificationFlagType.COMPROMISED_ACCOUNT)) {
      recommendations.push('Account may be compromised - verify through secure channel');
    }

    result.recommendations = recommendations;
  }

  // API Integration Methods (Simulated - replace with real API calls)
  
  private async checkTruecallerAPI(phoneNumber: string): Promise<VerificationSource> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate response based on phone patterns
    const isLikelyScam = phoneNumber.includes('123') || phoneNumber.includes('000');
    
    return {
      name: 'Truecaller',
      url: 'https://www.truecaller.com',
      lastChecked: new Date(),
      status: isLikelyScam ? 'flagged' : 'verified',
      details: isLikelyScam ? 'Flagged by 15+ users as spam/fraud' : 'No reports found',
      confidence: isLikelyScam ? 85 : 70
    };
  }

  private async checkNumverifyAPI(phoneNumber: string): Promise<VerificationSource> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));
    
    return {
      name: 'Numverify',
      url: 'https://numverify.com',
      lastChecked: new Date(),
      status: 'verified',
      details: 'Valid phone number format',
      confidence: 90
    };
  }

  private async checkHunterAPI(email: string): Promise<VerificationSource> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 400));
    
    const isValidDomain = !email.includes('temp') && !email.includes('fake');
    
    return {
      name: 'Hunter.io',
      url: 'https://hunter.io',
      lastChecked: new Date(),
      status: isValidDomain ? 'verified' : 'flagged',
      details: isValidDomain ? 'Email deliverable' : 'Suspicious domain pattern',
      confidence: isValidDomain ? 85 : 30
    };
  }

  private async checkEmailRepAPI(email: string): Promise<VerificationSource> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 600));
    
    const isSuspicious = email.includes('scam') || email.includes('fake') || email.includes('temp');
    
    return {
      name: 'EmailRep',
      url: 'https://emailrep.io',
      lastChecked: new Date(),
      status: isSuspicious ? 'flagged' : 'verified',
      details: isSuspicious ? 'High spam reputation score' : 'Good reputation',
      confidence: 80
    };
  }

  private async queryScammerDatabase(
    databaseName: string,
    contactValue: string,
    contactType: ContactType
  ): Promise<ScammerDatabaseResult> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
    
    // Simulate database hit for suspicious patterns
    const isKnownScammer = contactValue.includes('scam') || 
                          contactValue.includes('123456') || 
                          contactValue.includes('fake');
    
    if (isKnownScammer) {
      return {
        databaseName,
        foundMatch: true,
        matchDetails: {
          reportCount: Math.floor(Math.random() * 50) + 5,
          firstReported: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          lastReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          scamTypes: ['Investment Fraud', 'Romance Scam', 'Tech Support'],
          victimCount: Math.floor(Math.random() * 20) + 3,
          totalLoss: Math.floor(Math.random() * 100000) + 10000,
          jurisdictions: ['US', 'UK', 'CA']
        },
        confidence: 95
      };
    }
    
    return {
      databaseName,
      foundMatch: false,
      confidence: 0
    };
  }

  // Utility Methods

  private extractCountryCode(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+1')) return '+1';
    if (cleaned.startsWith('+44')) return '+44';
    if (cleaned.startsWith('+91')) return '+91';
    return '+1'; // Default
  }

  private determineLineType(phoneNumber: string): 'mobile' | 'landline' | 'voip' | 'toll-free' | 'unknown' {
    if (phoneNumber.includes('800') || phoneNumber.includes('888')) return 'toll-free';
    if (phoneNumber.length > 10) return 'mobile';
    return 'unknown';
  }

  private getCountryFromCode(countryCode: string): string {
    const countryMap: Record<string, string> = {
      '+1': 'United States',
      '+44': 'United Kingdom',
      '+91': 'India'
    };
    return countryMap[countryCode] || 'Unknown';
  }

  private isLikelyVoipOrBurner(phoneNumber: string): boolean {
    // Simplified VOIP/burner detection
    const suspiciousPatterns = ['000', '123', '999', '555'];
    return suspiciousPatterns.some(pattern => phoneNumber.includes(pattern));
  }

  private async isDisposableEmail(domain: string): Promise<boolean> {
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com', 
      'temp-mail.org', 'throwaway.email', 'mailinator.com'
    ];
    return disposableDomains.includes(domain);
  }

  private isRoleAccount(email: string): boolean {
    const rolePatterns = ['admin@', 'info@', 'support@', 'contact@', 'sales@', 'noreply@'];
    return rolePatterns.some(pattern => email.startsWith(pattern));
  }

  private async getDomainAge(domain: string): Promise<number | undefined> {
    // Simulate domain age lookup
    await new Promise(resolve => setTimeout(resolve, 200));
    return Math.floor(Math.random() * 3000) + 30; // Random age between 30-3030 days
  }

  private async checkBreachHistory(email: string): Promise<any[]> {
    // Simulate breach database check
    if (email.includes('old') || email.includes('test')) {
      return [
        {
          breachName: 'DataBreach2023',
          breachDate: new Date('2023-06-15'),
          dataTypes: ['email', 'password'],
          source: 'HIBP'
        }
      ];
    }
    return [];
  }

  private async isCommonName(name: string): boolean {
    const commonNames = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson'];
    return commonNames.some(common => 
      name.toLowerCase().includes(common.toLowerCase())
    );
  }

  private predictGender(name: string): 'male' | 'female' | 'neutral' | 'unknown' {
    const firstName = name.split(' ')[0].toLowerCase();
    const maleNames = ['john', 'mike', 'david', 'james', 'robert'];
    const femaleNames = ['jane', 'sarah', 'lisa', 'mary', 'jennifer'];
    
    if (maleNames.includes(firstName)) return 'male';
    if (femaleNames.includes(firstName)) return 'female';
    return 'unknown';
  }

  private estimateAge(name: string): { min: number; max: number } | undefined {
    // Very basic age estimation based on name popularity
    const oldNames = ['robert', 'mary', 'helen', 'william'];
    const firstName = name.split(' ')[0].toLowerCase();
    
    if (oldNames.includes(firstName)) {
      return { min: 50, max: 80 };
    }
    return { min: 20, max: 60 };
  }

  private async checkScammerNames(name: string): Promise<string[]> {
    const knownScammerNames = [
      'Nigerian Prince',
      'Dr. Smith (Inheritance)',
      'Microsoft Support',
      'Amazon Security'
    ];
    
    return knownScammerNames.filter(scamName => 
      name.toLowerCase().includes(scamName.toLowerCase())
    );
  }

  private async checkPublicRecords(name: string): Promise<any[]> {
    // Simulate public records search
    if (name.toLowerCase().includes('criminal')) {
      return [
        {
          type: 'criminal',
          description: 'Fraud conviction 2020',
          date: new Date('2020-05-15'),
          jurisdiction: 'Federal',
          riskLevel: RiskLevel.HIGH
        }
      ];
    }
    return [];
  }

  private async storeVerificationResult(result: ContactVerificationResult): Promise<void> {
    try {
      // Store verification result in database for analytics
      await this.prisma.contactVerification.create({
        data: {
          id: result.id,
          contactType: result.contactType,
          contactValue: result.contactValue,
          isScammer: result.isScammer,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          confidence: result.confidence,
          verificationSources: result.verificationSources as any,
          scammerDatabases: result.scammerDatabases as any,
          additionalInfo: result.additionalInfo as any,
          flags: result.flags as any,
          recommendations: result.recommendations,
          createdAt: result.lastVerified
        }
      });
    } catch (error) {
      this.logger.warn(`Failed to store verification result: ${error.message}`);
    }
  }

  async getVerificationStats(): Promise<ContactVerificationStats> {
    try {
      const stats = await this.prisma.contactVerification.aggregate({
        _count: { id: true },
        _avg: { riskScore: true }
      });

      const scammerCount = await this.prisma.contactVerification.count({
        where: { isScammer: true }
      });

      return {
        totalVerifications: stats._count.id || 0,
        scammersDetected: scammerCount,
        falsePositives: 0, // Would need feedback system to calculate
        avgResponseTime: 2500, // Would track in real implementation
        sourceReliability: {
          'Truecaller': 85,
          'Hunter.io': 90,
          'EmailRep': 80,
          'FBI IC3 Database': 95
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get verification stats: ${error.message}`);
      throw error;
    }
  }
}