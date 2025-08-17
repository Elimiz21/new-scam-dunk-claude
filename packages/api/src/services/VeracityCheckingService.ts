import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../index';

interface CompanyInfo {
  name?: string;
  website?: string;
  registrationNumber?: string;
  additionalData?: any;
}

interface SECFilingInfo {
  cik: string;
  companyName: string;
  filingDate: string;
  formType: string;
  status: 'active' | 'inactive' | 'delinquent';
  businessAddress?: string;
  sicCode?: string;
  sicDescription?: string;
}

interface FINRAInfo {
  firmCRD: string;
  firmName: string;
  mainOfficeLocation: string;
  registrationStatus: 'active' | 'inactive' | 'terminated';
  dateRegistered: string;
  regulatoryEvents: Array<{
    eventType: string;
    eventDate: string;
    description: string;
  }>;
}

interface DomainInfo {
  domain: string;
  isActive: boolean;
  registrationDate?: Date;
  expirationDate?: Date;
  registrar?: string;
  nameServers?: string[];
  whoisPrivacy: boolean;
  riskScore: number;
  flags: string[];
}

interface VeracityResult {
  companyVerification: {
    exists: boolean;
    isLegitimate: boolean;
    registrationStatus: 'verified' | 'unverified' | 'suspicious' | 'fraudulent';
    sources: string[];
  };
  secInfo?: SECFilingInfo;
  finraInfo?: FINRAInfo;
  domainInfo?: DomainInfo;
  businessRegistration?: {
    isRegistered: boolean;
    jurisdiction?: string;
    registrationNumber?: string;
    status?: string;
    registrationDate?: Date;
  };
  overallVeracity: number; // 0-100
  veracityLevel: 'verified' | 'likely_legitimate' | 'questionable' | 'likely_fraudulent' | 'confirmed_fraudulent';
  confidence: number; // 0-100
  redFlags: string[];
  recommendations: string[];
  sources: Array<{
    name: string;
    result: 'verified' | 'not_found' | 'suspicious' | 'error';
    details?: any;
  }>;
}

class VeracityCheckingService {
  private cache: NodeCache;
  private knownScamCompanies: Set<string>;
  private knownLegitimateCompanies: Map<string, any>;
  private secDatabase: Map<string, SECFilingInfo>;
  private finraDatabase: Map<string, FINRAInfo>;
  
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.initializeKnownData();
  }
  
  private initializeKnownData() {
    // Known scam companies
    this.knownScamCompanies = new Set([
      'fake investment ltd',
      'ponzi holdings inc',
      'scam financial group',
      'quick profits llc',
      'guaranteed returns corp',
      'offshore wealth management',
      'instant millionaire fund',
      'crypto magic trading'
    ]);
    
    // Known legitimate companies (simplified database)
    this.knownLegitimateCompanies = new Map([
      ['apple inc', {
        name: 'Apple Inc.',
        website: 'apple.com',
        secCik: '0000320193',
        founded: 1976,
        jurisdiction: 'Delaware',
        nasdaq: 'AAPL'
      }],
      ['microsoft corporation', {
        name: 'Microsoft Corporation',
        website: 'microsoft.com',
        secCik: '0000789019',
        founded: 1975,
        jurisdiction: 'Washington',
        nasdaq: 'MSFT'
      }],
      ['amazon.com inc', {
        name: 'Amazon.com, Inc.',
        website: 'amazon.com',
        secCik: '0001018724',
        founded: 1994,
        jurisdiction: 'Delaware',
        nasdaq: 'AMZN'
      }],
      ['goldman sachs group inc', {
        name: 'The Goldman Sachs Group, Inc.',
        website: 'goldmansachs.com',
        secCik: '0000886982',
        founded: 1869,
        jurisdiction: 'Delaware',
        nyse: 'GS'
      }],
      ['jpmorgan chase & co', {
        name: 'JPMorgan Chase & Co.',
        website: 'jpmorganchase.com',
        secCik: '0000019617',
        founded: 1799,
        jurisdiction: 'Delaware',
        nyse: 'JPM'
      }]
    ]);
    
    // Simulated SEC database
    this.secDatabase = new Map([
      ['0000320193', {
        cik: '0000320193',
        companyName: 'Apple Inc.',
        filingDate: '2024-01-26',
        formType: '10-K',
        status: 'active',
        businessAddress: 'One Apple Park Way, Cupertino, CA 95014',
        sicCode: '3571',
        sicDescription: 'Electronic Computers'
      }],
      ['0000789019', {
        cik: '0000789019',
        companyName: 'Microsoft Corporation',
        filingDate: '2024-07-30',
        formType: '10-K',
        status: 'active',
        businessAddress: 'One Microsoft Way, Redmond, WA 98052-6399',
        sicCode: '7372',
        sicDescription: 'Prepackaged Software'
      }],
      ['0001018724', {
        cik: '0001018724',
        companyName: 'Amazon.com, Inc.',
        filingDate: '2024-02-02',
        formType: '10-K',
        status: 'active',
        businessAddress: '410 Terry Avenue North, Seattle, WA 98109-5210',
        sicCode: '5961',
        sicDescription: 'Catalog & Mail-Order Houses'
      }]
    ]);
    
    // Simulated FINRA database
    this.finraDatabase = new Map([
      ['149777', {
        firmCRD: '149777',
        firmName: 'Goldman Sachs & Co. LLC',
        mainOfficeLocation: '200 West Street, New York, NY 10282',
        registrationStatus: 'active',
        dateRegistered: '1981-12-31',
        regulatoryEvents: []
      }],
      ['19617', {
        firmCRD: '19617',
        firmName: 'J.P. Morgan Securities LLC',
        mainOfficeLocation: '383 Madison Avenue, New York, NY 10179',
        registrationStatus: 'active',
        dateRegistered: '1980-06-10',
        regulatoryEvents: []
      }],
      ['7654', {
        firmCRD: '7654',
        firmName: 'Morgan Stanley & Co. LLC',
        mainOfficeLocation: '1585 Broadway, New York, NY 10036',
        registrationStatus: 'active',
        dateRegistered: '1975-07-01',
        regulatoryEvents: []
      }]
    ]);
  }
  
  async checkVeracity(companyInfo: CompanyInfo, scanId: string): Promise<VeracityResult> {
    try {
      logger.info(`Starting veracity check for scan ${scanId}`);
      
      const companyName = companyInfo.name?.toLowerCase() || '';
      const website = companyInfo.website?.toLowerCase() || '';
      const registrationNumber = companyInfo.registrationNumber || '';
      
      // Check multiple sources
      const sources: Array<{ name: string; result: any; details?: any }> = [];
      
      // 1. Check against known scam database
      const scamCheck = this.checkScamDatabase(companyName);
      sources.push({
        name: 'Scam Database',
        result: scamCheck.isScam ? 'suspicious' : 'not_found',
        details: scamCheck
      });
      
      // 2. Check against known legitimate companies
      const legitimateCheck = this.checkLegitimateDatabase(companyName);
      sources.push({
        name: 'Legitimate Business Database',
        result: legitimateCheck.found ? 'verified' : 'not_found',
        details: legitimateCheck
      });
      
      // 3. Check SEC filings
      const secInfo = await this.checkSECFilings(companyName, registrationNumber);
      sources.push({
        name: 'SEC EDGAR Database',
        result: secInfo ? 'verified' : 'not_found',
        details: secInfo
      });
      
      // 4. Check FINRA registration
      const finraInfo = await this.checkFINRARegistration(companyName);
      sources.push({
        name: 'FINRA BrokerCheck',
        result: finraInfo ? 'verified' : 'not_found',
        details: finraInfo
      });
      
      // 5. Check domain information
      let domainInfo: DomainInfo | undefined;
      if (website) {
        domainInfo = await this.checkDomainInfo(website);
        sources.push({
          name: 'Domain Registration',
          result: domainInfo.isActive ? 'verified' : 'suspicious',
          details: domainInfo
        });
      }
      
      // 6. Check business registration
      const businessRegistration = await this.checkBusinessRegistration(companyName, registrationNumber);
      sources.push({
        name: 'Business Registration',
        result: businessRegistration.isRegistered ? 'verified' : 'not_found',
        details: businessRegistration
      });
      
      // Calculate overall veracity
      const veracityAssessment = this.calculateVeracity(
        scamCheck,
        legitimateCheck,
        secInfo,
        finraInfo,
        domainInfo,
        businessRegistration
      );
      
      const result: VeracityResult = {
        companyVerification: {
          exists: legitimateCheck.found || !!secInfo || !!finraInfo || businessRegistration.isRegistered,
          isLegitimate: !scamCheck.isScam && (legitimateCheck.found || !!secInfo || !!finraInfo),
          registrationStatus: veracityAssessment.registrationStatus,
          sources: sources.filter(s => s.result === 'verified').map(s => s.name)
        },
        secInfo: secInfo || undefined,
        finraInfo: finraInfo || undefined,
        domainInfo,
        businessRegistration,
        overallVeracity: veracityAssessment.overallVeracity,
        veracityLevel: veracityAssessment.veracityLevel,
        confidence: veracityAssessment.confidence,
        redFlags: veracityAssessment.redFlags,
        recommendations: veracityAssessment.recommendations,
        sources
      };
      
      logger.info(`Veracity check completed for scan ${scanId} with veracity level: ${result.veracityLevel}`);
      return result;
      
    } catch (error) {
      logger.error('Veracity checking failed:', error);
      throw error;
    }
  }
  
  private checkScamDatabase(companyName: string) {
    const isScam = this.knownScamCompanies.has(companyName);
    
    // Also check for common scam patterns
    const scamPatterns = [
      /guaranteed.*profit/i,
      /instant.*wealth/i,
      /quick.*rich/i,
      /offshore.*investment/i,
      /tax.*haven/i,
      /ponzi/i,
      /pyramid/i
    ];
    
    const hasScamPattern = scamPatterns.some(pattern => pattern.test(companyName));
    
    return {
      isScam: isScam || hasScamPattern,
      reason: isScam ? 'Found in known scam database' : 
              hasScamPattern ? 'Contains typical scam keywords' : null,
      confidence: isScam ? 95 : hasScamPattern ? 75 : 10
    };
  }
  
  private checkLegitimateDatabase(companyName: string) {
    for (const [key, company] of this.knownLegitimateCompanies.entries()) {
      if (companyName.includes(key) || key.includes(companyName)) {
        return {
          found: true,
          company,
          confidence: 90
        };
      }
    }
    
    return {
      found: false,
      confidence: 0
    };
  }
  
  private async checkSECFilings(companyName: string, registrationNumber?: string): Promise<SECFilingInfo | null> {
    try {
      // Check cache first
      const cacheKey = `sec_${companyName}_${registrationNumber || ''}`;
      const cached = this.cache.get<SECFilingInfo>(cacheKey);
      if (cached) return cached;
      
      // In a real implementation, you would query the SEC EDGAR API
      // For now, we'll simulate the check
      
      // Check our simulated database
      for (const [cik, filing] of this.secDatabase.entries()) {
        if (filing.companyName.toLowerCase().includes(companyName) ||
            companyName.includes(filing.companyName.toLowerCase())) {
          this.cache.set(cacheKey, filing, 3600);
          return filing;
        }
      }
      
      // Simulate real SEC API call (commented out as it would need actual implementation)
      /*
      const response = await axios.get('https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json', {
        headers: {
          'User-Agent': 'Scam Dunk API (your-email@domain.com)'
        },
        timeout: 10000
      });
      */
      
      return null;
      
    } catch (error) {
      logger.error('SEC filing check failed:', error);
      return null;
    }
  }
  
  private async checkFINRARegistration(companyName: string): Promise<FINRAInfo | null> {
    try {
      const cacheKey = `finra_${companyName}`;
      const cached = this.cache.get<FINRAInfo>(cacheKey);
      if (cached) return cached;
      
      // Check our simulated FINRA database
      for (const [crd, firm] of this.finraDatabase.entries()) {
        if (firm.firmName.toLowerCase().includes(companyName) ||
            companyName.includes(firm.firmName.toLowerCase())) {
          this.cache.set(cacheKey, firm, 3600);
          return firm;
        }
      }
      
      // In real implementation, you would use FINRA's BrokerCheck API or web scraping
      // Note: FINRA doesn't have a public API, so this would require web scraping
      
      return null;
      
    } catch (error) {
      logger.error('FINRA registration check failed:', error);
      return null;
    }
  }
  
  private async checkDomainInfo(website: string): Promise<DomainInfo> {
    try {
      const cacheKey = `domain_${website}`;
      const cached = this.cache.get<DomainInfo>(cacheKey);
      if (cached) return cached;
      
      // Clean the domain
      const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      
      // Simulate domain analysis
      const domainInfo = this.simulateDomainAnalysis(domain);
      
      this.cache.set(cacheKey, domainInfo, 1800);
      return domainInfo;
      
    } catch (error) {
      logger.error('Domain info check failed:', error);
      return {
        domain: website,
        isActive: false,
        whoisPrivacy: true,
        riskScore: 100,
        flags: ['Unable to verify domain information']
      };
    }
  }
  
  private simulateDomainAnalysis(domain: string): DomainInfo {
    const flags: string[] = [];
    let riskScore = 0;
    
    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      flags.push('Uses suspicious top-level domain');
      riskScore += 40;
    }
    
    // Check for IP addresses instead of domains
    if (/^\d+\.\d+\.\d+\.\d+/.test(domain)) {
      flags.push('Uses IP address instead of domain name');
      riskScore += 50;
    }
    
    // Check for suspicious patterns
    if (/\d{4,}/.test(domain)) {
      flags.push('Contains many numbers (suspicious pattern)');
      riskScore += 20;
    }
    
    if (domain.split('.').length > 3) {
      flags.push('Unusually complex subdomain structure');
      riskScore += 15;
    }
    
    // Check for typosquatting patterns
    const legitimateDomains = ['google', 'microsoft', 'apple', 'amazon', 'paypal', 'ebay'];
    for (const legitDomain of legitimateDomains) {
      if (domain.includes(legitDomain) && !domain.includes(`${legitDomain}.com`)) {
        flags.push(`Possible typosquatting of ${legitDomain}`);
        riskScore += 60;
      }
    }
    
    // Simulate age check (newer domains are riskier)
    const isNewDomain = Math.random() > 0.7; // 30% chance of being new
    const registrationDate = isNewDomain ? 
      new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : // Within last year
      new Date(Date.now() - (2 + Math.random() * 10) * 365 * 24 * 60 * 60 * 1000); // 2-12 years old
    
    if (isNewDomain) {
      flags.push('Domain registered recently (within 1 year)');
      riskScore += 25;
    }
    
    // Simulate WHOIS privacy
    const whoisPrivacy = Math.random() > 0.4; // 60% have privacy protection
    if (whoisPrivacy) {
      flags.push('WHOIS privacy protection enabled');
      riskScore += 10;
    }
    
    return {
      domain,
      isActive: riskScore < 80, // Consider inactive if very risky
      registrationDate,
      expirationDate: new Date(registrationDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      registrar: 'Simulated Registrar',
      nameServers: ['ns1.example.com', 'ns2.example.com'],
      whoisPrivacy,
      riskScore: Math.min(riskScore, 100),
      flags
    };
  }
  
  private async checkBusinessRegistration(companyName: string, registrationNumber?: string) {
    try {
      // In real implementation, this would check multiple business registries
      // (state business registries, companies house, etc.)
      
      // Simulate business registration check
      const isRegistered = Math.random() > 0.3; // 70% chance of being registered
      
      if (!isRegistered) {
        return {
          isRegistered: false
        };
      }
      
      return {
        isRegistered: true,
        jurisdiction: this.getRandomJurisdiction(),
        registrationNumber: registrationNumber || this.generateRegistrationNumber(),
        status: 'active',
        registrationDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)
      };
      
    } catch (error) {
      logger.error('Business registration check failed:', error);
      return {
        isRegistered: false
      };
    }
  }
  
  private getRandomJurisdiction(): string {
    const jurisdictions = ['Delaware', 'Nevada', 'California', 'New York', 'Texas', 'Florida'];
    return jurisdictions[Math.floor(Math.random() * jurisdictions.length)];
  }
  
  private generateRegistrationNumber(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  private calculateVeracity(
    scamCheck: any,
    legitimateCheck: any,
    secInfo: SECFilingInfo | null,
    finraInfo: FINRAInfo | null,
    domainInfo?: DomainInfo,
    businessRegistration?: any
  ) {
    let veracityScore = 50; // Start neutral
    const redFlags: string[] = [];
    let confidence = 30;
    
    // Scam database check
    if (scamCheck.isScam) {
      veracityScore -= 80;
      redFlags.push(scamCheck.reason);
      confidence += 30;
    }
    
    // Legitimate database check
    if (legitimateCheck.found) {
      veracityScore += 40;
      confidence += 25;
    }
    
    // SEC registration
    if (secInfo) {
      veracityScore += 30;
      confidence += 20;
      if (secInfo.status === 'active') {
        veracityScore += 10;
      } else {
        redFlags.push('SEC filing status is not active');
        veracityScore -= 15;
      }
    }
    
    // FINRA registration
    if (finraInfo) {
      veracityScore += 25;
      confidence += 15;
      if (finraInfo.registrationStatus === 'active') {
        veracityScore += 10;
      } else {
        redFlags.push('FINRA registration status is not active');
        veracityScore -= 20;
      }
      
      if (finraInfo.regulatoryEvents.length > 0) {
        redFlags.push(`${finraInfo.regulatoryEvents.length} regulatory events found`);
        veracityScore -= finraInfo.regulatoryEvents.length * 5;
      }
    }
    
    // Domain analysis
    if (domainInfo) {
      veracityScore -= domainInfo.riskScore * 0.3; // Scale domain risk
      confidence += 10;
      redFlags.push(...domainInfo.flags);
      
      if (!domainInfo.isActive) {
        redFlags.push('Domain appears to be inactive');
        veracityScore -= 20;
      }
    }
    
    // Business registration
    if (businessRegistration?.isRegistered) {
      veracityScore += 15;
      confidence += 10;
    } else {
      redFlags.push('No business registration found');
      veracityScore -= 10;
    }
    
    // Cap scores
    veracityScore = Math.max(0, Math.min(100, veracityScore));
    confidence = Math.max(0, Math.min(100, confidence));
    
    // Determine veracity level
    let veracityLevel: 'verified' | 'likely_legitimate' | 'questionable' | 'likely_fraudulent' | 'confirmed_fraudulent';
    let registrationStatus: 'verified' | 'unverified' | 'suspicious' | 'fraudulent';
    
    if (scamCheck.isScam || veracityScore < 20) {
      veracityLevel = 'confirmed_fraudulent';
      registrationStatus = 'fraudulent';
    } else if (veracityScore < 40) {
      veracityLevel = 'likely_fraudulent';
      registrationStatus = 'suspicious';
    } else if (veracityScore < 60) {
      veracityLevel = 'questionable';
      registrationStatus = 'unverified';
    } else if (veracityScore < 80) {
      veracityLevel = 'likely_legitimate';
      registrationStatus = 'verified';
    } else {
      veracityLevel = 'verified';
      registrationStatus = 'verified';
    }
    
    // Generate recommendations
    const recommendations = this.generateVeracityRecommendations(veracityLevel, redFlags, secInfo, finraInfo);
    
    return {
      overallVeracity: Math.round(veracityScore),
      veracityLevel,
      registrationStatus,
      confidence: Math.round(confidence),
      redFlags,
      recommendations
    };
  }
  
  private generateVeracityRecommendations(
    veracityLevel: string,
    redFlags: string[],
    secInfo?: SECFilingInfo | null,
    finraInfo?: FINRAInfo | null
  ): string[] {
    const recommendations = [];
    
    if (veracityLevel === 'confirmed_fraudulent') {
      recommendations.push('🚨 CONFIRMED SCAM: Do not engage with this company');
      recommendations.push('Report this company to relevant authorities');
      recommendations.push('Do not send money or share personal information');
    } else if (veracityLevel === 'likely_fraudulent') {
      recommendations.push('⚠️ HIGH FRAUD RISK: Avoid this company');
      recommendations.push('Multiple red flags indicate fraudulent activity');
      recommendations.push('Seek alternatives from verified companies');
    } else if (veracityLevel === 'questionable') {
      recommendations.push('⚠️ CAUTION: This company cannot be verified');
      recommendations.push('Request proof of registration and licenses');
      recommendations.push('Consider using only verified companies');
    } else if (veracityLevel === 'likely_legitimate') {
      recommendations.push('✅ Appears legitimate but verify independently');
      recommendations.push('Check current registration status before proceeding');
    } else {
      recommendations.push('✅ Company appears to be verified and legitimate');
      recommendations.push('Still exercise normal due diligence');
    }
    
    if (!secInfo && !finraInfo) {
      recommendations.push('No SEC or FINRA registration found - verify if required for this business type');
    }
    
    if (redFlags.length > 0) {
      recommendations.push(`Address the following concerns: ${redFlags.slice(0, 3).join(', ')}`);
    }
    
    // General recommendations
    recommendations.push('Always verify company information through official channels');
    recommendations.push('Be cautious of unsolicited investment opportunities');
    recommendations.push('Check for proper licensing for financial services');
    
    return recommendations;
  }
  
  async getBulkVeracityCheck(companies: CompanyInfo[]): Promise<VeracityResult[]> {
    const results = await Promise.allSettled(
      companies.map(company => this.checkVeracity(company, 'bulk-check'))
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`Bulk veracity check failed for company ${index}:`, result.reason);
        // Return a default failed result
        return {
          companyVerification: {
            exists: false,
            isLegitimate: false,
            registrationStatus: 'unverified' as const,
            sources: []
          },
          overallVeracity: 0,
          veracityLevel: 'questionable' as const,
          confidence: 0,
          redFlags: ['Verification failed due to technical error'],
          recommendations: ['Unable to verify - proceed with extreme caution'],
          sources: []
        };
      }
    });
  }
  
  async getVeracityHistory(companyName: string): Promise<any[]> {
    // In a real implementation, this would return historical veracity checks
    return [];
  }
}

export default new VeracityCheckingService();