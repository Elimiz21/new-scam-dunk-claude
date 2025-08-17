import axios from 'axios';
import NodeCache from 'node-cache';
import ContactVerification, { IContactVerification } from '../models/ContactVerification';
import { logger } from '../index';

interface TruecallerResponse {
  name?: string;
  isSpam: boolean;
  spamScore: number;
  tags: string[];
  lastSeen?: Date;
}

interface CarrierInfo {
  name?: string;
  country?: string;
  mcc?: string;
  mnc?: string;
}

interface PhoneValidationResult {
  isValid: boolean;
  isActive: boolean;
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  countryCode: string;
  formattedNumber: string;
}

class ContactVerificationService {
  private cache: NodeCache;
  private truecallerApiKey: string;
  private numverifyApiKey: string;
  
  // Simulation databases for realistic responses
  private spamDatabase: Map<string, { isSpam: boolean; score: number; tags: string[] }>;
  private carrierDatabase: Map<string, CarrierInfo>;
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.truecallerApiKey = process.env.TRUECALLER_API_KEY || '';
    this.numverifyApiKey = process.env.NUMVERIFY_API_KEY || '';
    
    this.initializeSimulationDatabases();
  }
  
  private initializeSimulationDatabases() {
    // Initialize spam database with common scam patterns
    this.spamDatabase = new Map([
      // High-risk numbers (common scam patterns)
      ['+1-800-000-0000', { isSpam: true, score: 95, tags: ['telemarketing', 'scam', 'robocall'] }],
      ['+234-802-000-0000', { isSpam: true, score: 88, tags: ['419_scam', 'advance_fee_fraud'] }],
      ['+91-98765-43210', { isSpam: true, score: 75, tags: ['tech_support_scam', 'fake_call'] }],
      ['+44-20-7946-0958', { isSpam: true, score: 65, tags: ['phishing', 'bank_impersonation'] }],
      
      // Medium-risk numbers
      ['+1-555-123-4567', { isSpam: false, score: 45, tags: ['telemarketing'] }],
      ['+1-888-555-0123', { isSpam: false, score: 30, tags: ['customer_service'] }],
      
      // Low-risk numbers
      ['+1-555-000-1234', { isSpam: false, score: 5, tags: ['verified', 'business'] }],
      ['+44-20-1234-5678', { isSpam: false, score: 10, tags: ['business', 'london'] }]
    ]);
    
    // Initialize carrier database
    this.carrierDatabase = new Map([
      ['1', { name: 'Verizon', country: 'US', mcc: '310', mnc: '004' }],
      ['44', { name: 'EE', country: 'UK', mcc: '234', mnc: '30' }],
      ['91', { name: 'Airtel', country: 'IN', mcc: '404', mnc: '49' }],
      ['234', { name: 'MTN', country: 'NG', mcc: '621', mnc: '30' }],
      ['33', { name: 'Orange', country: 'FR', mcc: '208', mnc: '01' }],
      ['49', { name: 'Deutsche Telekom', country: 'DE', mcc: '262', mnc: '01' }]
    ]);
  }
  
  async verifyContact(phoneNumber: string, scanId: string): Promise<IContactVerification> {
    try {
      logger.info(`Starting contact verification for ${phoneNumber}`);
      
      // Check cache first
      const cacheKey = `contact_verification_${phoneNumber}`;
      const cached = this.cache.get<IContactVerification>(cacheKey);
      if (cached) {
        logger.info(`Using cached result for ${phoneNumber}`);
        return cached;
      }
      
      // Validate phone number format
      const validation = await this.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        throw new Error(`Invalid phone number: ${phoneNumber}`);
      }
      
      // Get Truecaller data (or simulation)
      const truecallerData = await this.getTruecallerData(validation.formattedNumber);
      
      // Get carrier information
      const carrierInfo = await this.getCarrierInfo(validation.countryCode);
      
      // Perform risk analysis
      const riskAnalysis = await this.performRiskAnalysis(validation, truecallerData, carrierInfo);
      
      // Get additional data
      const additionalData = await this.getAdditionalData(validation.formattedNumber);
      
      // Create verification record
      const verificationData: Partial<IContactVerification> = {
        scanId,
        phoneNumber: validation.formattedNumber,
        countryCode: validation.countryCode,
        carrier: validation.carrier,
        lineType: validation.lineType,
        isValid: validation.isValid,
        isActive: validation.isActive,
        truecaller: truecallerData,
        carrierInfo,
        riskAnalysis,
        additionalData,
        verificationHistory: [{
          date: new Date(),
          result: riskAnalysis.isHighRisk ? 'suspicious' : 'verified',
          source: 'ContactVerificationService',
          notes: `Automated verification with risk score: ${riskAnalysis.riskScore}`
        }]
      };
      
      const verification = new ContactVerification(verificationData);
      await verification.save();
      
      // Cache the result
      this.cache.set(cacheKey, verification, 3600);
      
      logger.info(`Contact verification completed for ${phoneNumber} with risk score: ${riskAnalysis.riskScore}`);
      return verification;
      
    } catch (error) {
      logger.error('Contact verification failed:', error);
      throw error;
    }
  }
  
  private async validatePhoneNumber(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      // Clean the phone number
      const cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // Extract country code
      let countryCode = '';
      let nationalNumber = '';
      
      if (cleaned.startsWith('+')) {
        // Parse international format
        const match = cleaned.match(/^\+(\d{1,3})(.+)$/);
        if (match) {
          countryCode = match[1];
          nationalNumber = match[2];
        }
      } else {
        // Assume US number if no country code
        countryCode = '1';
        nationalNumber = cleaned;
      }
      
      const formattedNumber = `+${countryCode}-${nationalNumber}`;
      
      // Use external API if available, otherwise simulate
      if (this.numverifyApiKey) {
        return await this.validateWithNumverify(cleaned);
      } else {
        return this.simulatePhoneValidation(countryCode, nationalNumber, formattedNumber);
      }
      
    } catch (error) {
      logger.error('Phone validation error:', error);
      throw new Error('Phone number validation failed');
    }
  }
  
  private async validateWithNumverify(phoneNumber: string): Promise<PhoneValidationResult> {
    try {
      const response = await axios.get('http://apilayer.net/api/validate', {
        params: {
          access_key: this.numverifyApiKey,
          number: phoneNumber,
          country_code: '',
          format: 1
        },
        timeout: 5000
      });
      
      const data = response.data;
      
      return {
        isValid: data.valid,
        isActive: data.valid && data.line_type !== 'unknown',
        lineType: data.line_type || 'unknown',
        carrier: data.carrier,
        countryCode: data.country_code,
        formattedNumber: data.international_format || phoneNumber
      };
      
    } catch (error) {
      logger.error('Numverify API error:', error);
      throw error;
    }
  }
  
  private simulatePhoneValidation(countryCode: string, nationalNumber: string, formattedNumber: string): PhoneValidationResult {
    // Simulate validation based on patterns
    const isValid = this.isValidPhonePattern(countryCode, nationalNumber);
    const lineType = this.determineLineType(nationalNumber);
    const carrier = this.carrierDatabase.get(countryCode)?.name;
    
    return {
      isValid,
      isActive: isValid && Math.random() > 0.1, // 90% active rate for valid numbers
      lineType,
      carrier,
      countryCode,
      formattedNumber
    };
  }
  
  private isValidPhonePattern(countryCode: string, nationalNumber: string): boolean {
    const patterns: { [key: string]: RegExp } = {
      '1': /^\d{10}$/, // US/Canada
      '44': /^\d{10,11}$/, // UK
      '91': /^\d{10}$/, // India
      '234': /^\d{7,10}$/, // Nigeria
      '33': /^\d{9}$/, // France
      '49': /^\d{10,11}$/, // Germany
    };
    
    const pattern = patterns[countryCode];
    return pattern ? pattern.test(nationalNumber) : nationalNumber.length >= 7 && nationalNumber.length <= 15;
  }
  
  private determineLineType(nationalNumber: string): 'mobile' | 'landline' | 'voip' | 'unknown' {
    // Simple heuristics for line type
    if (nationalNumber.startsWith('8') || nationalNumber.startsWith('9')) {
      return 'mobile';
    } else if (nationalNumber.startsWith('2') || nationalNumber.startsWith('3')) {
      return 'landline';
    } else if (nationalNumber.startsWith('5')) {
      return 'voip';
    }
    return 'unknown';
  }
  
  private async getTruecallerData(phoneNumber: string): Promise<any> {
    try {
      // Check simulation database first
      const simData = this.spamDatabase.get(phoneNumber);
      if (simData) {
        return {
          isAvailable: true,
          name: this.generateNameForNumber(phoneNumber),
          isSpam: simData.isSpam,
          spamScore: simData.score,
          tags: simData.tags,
          lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within 30 days
        };
      }
      
      // If Truecaller API is available
      if (this.truecallerApiKey) {
        return await this.queryTruecallerAPI(phoneNumber);
      }
      
      // Simulate Truecaller response
      return this.simulateTruecallerResponse(phoneNumber);
      
    } catch (error) {
      logger.error('Truecaller query error:', error);
      return {
        isAvailable: false,
        isSpam: false,
        spamScore: 0,
        tags: []
      };
    }
  }
  
  private async queryTruecallerAPI(phoneNumber: string): Promise<TruecallerResponse> {
    // Note: Truecaller doesn't have a public API, this is a simulation
    // In practice, you'd use alternative APIs or web scraping (with legal considerations)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return this.simulateTruecallerResponse(phoneNumber);
      
    } catch (error) {
      logger.error('Truecaller API error:', error);
      throw error;
    }
  }
  
  private simulateTruecallerResponse(phoneNumber: string): any {
    // Generate realistic response based on phone number patterns
    const hash = this.simpleHash(phoneNumber);
    const spamProbability = (hash % 100) / 100;
    
    const isSpam = spamProbability > 0.7; // 30% spam rate
    const spamScore = isSpam ? 60 + (hash % 40) : hash % 30;
    
    let tags: string[] = [];
    if (isSpam) {
      const spamTags = ['telemarketing', 'scam', 'robocall', 'phishing', 'fraud'];
      tags = spamTags.slice(0, 1 + (hash % 3));
    } else {
      const legitimateTags = ['business', 'verified', 'customer_service'];
      tags = Math.random() > 0.5 ? legitimateTags.slice(0, 1) : [];
    }
    
    return {
      isAvailable: Math.random() > 0.2, // 80% availability
      name: Math.random() > 0.3 ? this.generateNameForNumber(phoneNumber) : undefined,
      isSpam,
      spamScore,
      tags,
      lastSeen: isSpam ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined
    };
  }
  
  private generateNameForNumber(phoneNumber: string): string {
    const hash = this.simpleHash(phoneNumber);
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Alex', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
    
    return `${firstNames[hash % firstNames.length]} ${lastNames[(hash + 5) % lastNames.length]}`;
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private async getCarrierInfo(countryCode: string): Promise<CarrierInfo> {
    return this.carrierDatabase.get(countryCode) || {
      name: 'Unknown Carrier',
      country: 'Unknown',
      mcc: '',
      mnc: ''
    };
  }
  
  private async performRiskAnalysis(
    validation: PhoneValidationResult,
    truecallerData: any,
    carrierInfo: CarrierInfo
  ): Promise<any> {
    const riskFactors: Array<{ factor: string; weight: number; description: string }> = [];
    let riskScore = 0;
    
    // Analyze Truecaller data
    if (truecallerData.isSpam) {
      const weight = truecallerData.spamScore * 0.8;
      riskFactors.push({
        factor: 'spam_reported',
        weight,
        description: `Number reported as spam with score ${truecallerData.spamScore}`
      });
      riskScore += weight;
    }
    
    // Analyze line type
    if (validation.lineType === 'voip') {
      const weight = 25;
      riskFactors.push({
        factor: 'voip_number',
        weight,
        description: 'VoIP numbers are commonly used in scams for anonymity'
      });
      riskScore += weight;
    }
    
    // Analyze country risk
    const highRiskCountries = ['234', '233', '254']; // Nigeria, Ghana, Kenya (common for 419 scams)
    if (highRiskCountries.includes(validation.countryCode)) {
      const weight = 30;
      riskFactors.push({
        factor: 'high_risk_country',
        weight,
        description: 'Number from country with high scam activity'
      });
      riskScore += weight;
    }
    
    // Analyze tags
    const dangerousTags = ['scam', 'fraud', 'phishing', '419_scam', 'tech_support_scam'];
    const foundDangerousTags = truecallerData.tags.filter((tag: string) =>
      dangerousTags.includes(tag)
    );
    
    if (foundDangerousTags.length > 0) {
      const weight = foundDangerousTags.length * 15;
      riskFactors.push({
        factor: 'dangerous_tags',
        weight,
        description: `Tagged with dangerous categories: ${foundDangerousTags.join(', ')}`
      });
      riskScore += weight;
    }
    
    // Analyze if number is inactive
    if (!validation.isActive) {
      const weight = 20;
      riskFactors.push({
        factor: 'inactive_number',
        weight,
        description: 'Inactive numbers may indicate spoofing or temporary use'
      });
      riskScore += weight;
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    const isHighRisk = riskScore >= 60;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (isHighRisk) {
      recommendations.push('Exercise extreme caution when dealing with this number');
      recommendations.push('Verify the caller\'s identity through alternative means');
      recommendations.push('Do not share personal or financial information');
    }
    
    if (truecallerData.isSpam) {
      recommendations.push('This number has been reported as spam by other users');
    }
    
    if (validation.lineType === 'voip') {
      recommendations.push('Be aware that VoIP numbers can be easily spoofed');
    }
    
    return {
      riskScore: Math.round(riskScore),
      riskFactors,
      isHighRisk,
      recommendations
    };
  }
  
  private async getAdditionalData(phoneNumber: string): Promise<any> {
    // Simulate additional data gathering
    const countryCode = phoneNumber.split('-')[0].replace('+', '');
    
    const countryInfo: { [key: string]: any } = {
      '1': { country: 'United States', region: 'North America', timezone: 'EST/PST' },
      '44': { country: 'United Kingdom', region: 'Europe', timezone: 'GMT' },
      '91': { country: 'India', region: 'Asia', timezone: 'IST' },
      '234': { country: 'Nigeria', region: 'Africa', timezone: 'WAT' },
      '33': { country: 'France', region: 'Europe', timezone: 'CET' },
      '49': { country: 'Germany', region: 'Europe', timezone: 'CET' }
    };
    
    const info = countryInfo[countryCode] || { country: 'Unknown', region: 'Unknown', timezone: 'Unknown' };
    
    return {
      timezone: info.timezone,
      location: {
        country: info.country,
        region: info.region
      },
      socialProfiles: [] // Would require additional API integrations
    };
  }
  
  async getVerificationHistory(phoneNumber: string): Promise<IContactVerification[]> {
    return ContactVerification.find({ phoneNumber })
      .sort({ createdAt: -1 })
      .limit(10);
  }
  
  async getHighRiskNumbers(limit: number = 20): Promise<IContactVerification[]> {
    return ContactVerification.find({ 'riskAnalysis.isHighRisk': true })
      .sort({ 'riskAnalysis.riskScore': -1, createdAt: -1 })
      .limit(limit)
      .populate('scanId', 'userId type');
  }
  
  async getSpamNumbers(limit: number = 20): Promise<IContactVerification[]> {
    return ContactVerification.find({ 'truecaller.isSpam': true })
      .sort({ 'truecaller.spamScore': -1, createdAt: -1 })
      .limit(limit)
      .populate('scanId', 'userId type');
  }
}

export default new ContactVerificationService();