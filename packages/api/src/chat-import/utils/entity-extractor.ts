import { MessageType } from '@prisma/client';

export interface EntityExtractionResult {
  urls: string[];
  phoneNumbers: string[];
  emails: string[];
  walletAddresses: string[];
  mentions: string[];
  hashtags: string[];
  suspiciousKeywords: string[];
  financialAmounts: FinancialAmount[];
  locations: string[];
}

export interface FinancialAmount {
  amount: number;
  currency: string;
  context: string;
}

export class EntityExtractor {
  private static readonly SUSPICIOUS_KEYWORDS = [
    // Investment scam keywords
    'guaranteed profit', 'risk-free', 'double your money', 'get rich quick',
    'investment opportunity', 'limited time offer', 'exclusive deal',
    'high returns', 'passive income', 'financial freedom',
    
    // Romance scam keywords
    'love you', 'soulmate', 'destiny', 'meant to be', 'true love',
    'emergency', 'hospital', 'stuck abroad', 'need money',
    
    // Tech support scam keywords
    'computer infected', 'virus detected', 'security alert', 'suspicious activity',
    'microsoft support', 'apple support', 'refund available',
    
    // Crypto scam keywords
    'bitcoin', 'ethereum', 'cryptocurrency', 'crypto wallet', 'mining',
    'blockchain', 'defi', 'nft', 'token', 'coin',
    
    // General scam indicators
    'urgent', 'act now', 'limited time', 'expire soon', 'verify account',
    'suspend account', 'confirm identity', 'click here', 'download',
    'install', 'grant access', 'remote access', 'teamviewer',
    
    // Financial keywords
    'wire transfer', 'western union', 'moneygram', 'gift card',
    'steam card', 'apple card', 'google play', 'amazon card',
    'bank account', 'routing number', 'social security',
    
    // Pressure tactics
    'dont tell anyone', 'keep secret', 'confidential', 'delete message',
    'trust me', 'believe me', 'honest person', 'god bless',
  ];

  private static readonly CURRENCY_PATTERNS = {
    USD: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    EUR: /€\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    GBP: /£\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    BTC: /(\d+(?:\.\d+)?)\s?BTC/gi,
    ETH: /(\d+(?:\.\d+)?)\s?ETH/gi,
  };

  static extractEntities(text: string): EntityExtractionResult {
    return {
      urls: this.extractUrls(text),
      phoneNumbers: this.extractPhoneNumbers(text),
      emails: this.extractEmails(text),
      walletAddresses: this.extractWalletAddresses(text),
      mentions: this.extractMentions(text),
      hashtags: this.extractHashtags(text),
      suspiciousKeywords: this.extractSuspiciousKeywords(text),
      financialAmounts: this.extractFinancialAmounts(text),
      locations: this.extractLocations(text),
    };
  }

  private static extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = text.match(urlRegex) || [];
    
    // Also extract URLs without protocol
    const urlWithoutProtocolRegex = /(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const withoutProtocol = text.match(urlWithoutProtocolRegex) || [];
    
    return [...matches, ...withoutProtocol.filter(url => !matches.includes(url))];
  }

  private static extractPhoneNumbers(text: string): string[] {
    const patterns = [
      // International format
      /\+\d{1,3}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
      // US format
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      // Generic format
      /\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4,6}/g,
    ];

    const numbers: string[] = [];
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      numbers.push(...matches);
    });

    return [...new Set(numbers)];
  }

  private static extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  private static extractWalletAddresses(text: string): string[] {
    const addresses: string[] = [];
    
    // Bitcoin Legacy (P2PKH)
    const btcLegacyRegex = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g;
    const btcLegacy = text.match(btcLegacyRegex) || [];
    addresses.push(...btcLegacy);
    
    // Bitcoin Bech32 (P2WPKH and P2WSH)
    const btcBech32Regex = /\bbc1[a-z0-9]{39,59}\b/g;
    const btcBech32 = text.match(btcBech32Regex) || [];
    addresses.push(...btcBech32);
    
    // Ethereum addresses
    const ethRegex = /0x[a-fA-F0-9]{40}\b/g;
    const ethAddresses = text.match(ethRegex) || [];
    addresses.push(...ethAddresses);
    
    // Litecoin addresses
    const ltcRegex = /\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\b/g;
    const ltcAddresses = text.match(ltcRegex) || [];
    addresses.push(...ltcAddresses);
    
    // Dogecoin addresses
    const dogeRegex = /\bD{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}\b/g;
    const dogeAddresses = text.match(dogeRegex) || [];
    addresses.push(...dogeAddresses);

    return addresses;
  }

  private static extractMentions(text: string): string[] {
    const mentionRegex = /@[\w.]+/g;
    return text.match(mentionRegex) || [];
  }

  private static extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  private static extractSuspiciousKeywords(text: string): string[] {
    const lowerText = text.toLowerCase();
    return this.SUSPICIOUS_KEYWORDS.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  private static extractFinancialAmounts(text: string): FinancialAmount[] {
    const amounts: FinancialAmount[] = [];
    
    Object.entries(this.CURRENCY_PATTERNS).forEach(([currency, pattern]) => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          amounts.push({
            amount,
            currency,
            context: this.getContext(text, match.index || 0, 50),
          });
        }
      });
    });

    return amounts;
  }

  private static extractLocations(text: string): string[] {
    // Simple location patterns - could be enhanced with NLP
    const locationPatterns = [
      // Country names (common ones)
      /\b(USA|United States|America|UK|United Kingdom|Canada|Australia|Germany|France|Italy|Spain|Russia|China|Japan|India|Brazil|Nigeria|Ghana|Kenya|South Africa)\b/gi,
      // City patterns
      /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}\b/g, // City, State format
      // Address patterns
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)/gi,
    ];

    const locations: string[] = [];
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      locations.push(...matches);
    });

    return [...new Set(locations)];
  }

  private static getContext(text: string, index: number, length: number): string {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text.substring(start, end);
  }
}

export class RiskAssessment {
  static calculateMessageRisk(
    content: string, 
    entities: EntityExtractionResult, 
    messageType: MessageType,
    senderInfo?: { messageCount: number; timeSpan: number }
  ): { score: number; flags: string[] } {
    let riskScore = 0;
    const flags: string[] = [];

    // Suspicious keywords
    if (entities.suspiciousKeywords.length > 0) {
      riskScore += entities.suspiciousKeywords.length * 10;
      flags.push(`Contains suspicious keywords: ${entities.suspiciousKeywords.join(', ')}`);
    }

    // Financial amounts
    if (entities.financialAmounts.length > 0) {
      const totalAmount = entities.financialAmounts.reduce((sum, fa) => sum + fa.amount, 0);
      if (totalAmount > 1000) {
        riskScore += 20;
        flags.push('Contains large financial amounts');
      } else if (totalAmount > 100) {
        riskScore += 10;
        flags.push('Contains financial amounts');
      }
    }

    // Wallet addresses
    if (entities.walletAddresses.length > 0) {
      riskScore += entities.walletAddresses.length * 15;
      flags.push('Contains cryptocurrency wallet addresses');
    }

    // Multiple URLs
    if (entities.urls.length > 2) {
      riskScore += 15;
      flags.push('Contains multiple URLs');
    } else if (entities.urls.length > 0) {
      riskScore += 5;
      flags.push('Contains URLs');
    }

    // Urgency indicators
    const urgencyWords = ['urgent', 'immediately', 'asap', 'hurry', 'quick', 'fast', 'now', 'expire'];
    const urgencyCount = urgencyWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    if (urgencyCount > 0) {
      riskScore += urgencyCount * 8;
      flags.push('Contains urgency indicators');
    }

    // Message type risks
    if (messageType === MessageType.FILE || messageType === MessageType.DOCUMENT) {
      riskScore += 10;
      flags.push('Contains file attachment');
    }

    // Sender behavior (if available)
    if (senderInfo) {
      if (senderInfo.messageCount < 5 && senderInfo.timeSpan < 3600000) { // Less than 5 messages in 1 hour
        riskScore += 15;
        flags.push('New or low-activity sender');
      }
    }

    // Phone number patterns
    if (entities.phoneNumbers.length > 0) {
      riskScore += entities.phoneNumbers.length * 5;
      flags.push('Contains phone numbers');
    }

    // Long message with financial content
    if (content.length > 500 && entities.financialAmounts.length > 0) {
      riskScore += 10;
      flags.push('Long message with financial content');
    }

    // All caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 50) {
      riskScore += 10;
      flags.push('Excessive use of capital letters');
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, riskScore);

    return { score: riskScore, flags };
  }

  static calculateParticipantRisk(
    participantData: {
      messageCount: number;
      suspiciousMessageCount: number;
      avgRiskScore: number;
      hasPhoneNumber: boolean;
      hasUsername: boolean;
      timeSpan: number;
    }
  ): { score: number; flags: string[] } {
    let riskScore = 0;
    const flags: string[] = [];

    // High average risk score
    if (participantData.avgRiskScore > 50) {
      riskScore += 30;
      flags.push('High average message risk score');
    } else if (participantData.avgRiskScore > 25) {
      riskScore += 15;
      flags.push('Moderate average message risk score');
    }

    // Many suspicious messages
    const suspiciousRatio = participantData.suspiciousMessageCount / participantData.messageCount;
    if (suspiciousRatio > 0.5) {
      riskScore += 25;
      flags.push('High ratio of suspicious messages');
    } else if (suspiciousRatio > 0.25) {
      riskScore += 15;
      flags.push('Some suspicious messages');
    }

    // No identifying information
    if (!participantData.hasPhoneNumber && !participantData.hasUsername) {
      riskScore += 10;
      flags.push('No identifying information provided');
    }

    // Burst messaging (many messages in short time)
    const messagesPerHour = participantData.messageCount / (participantData.timeSpan / 3600000);
    if (messagesPerHour > 50) {
      riskScore += 20;
      flags.push('High messaging frequency');
    } else if (messagesPerHour > 20) {
      riskScore += 10;
      flags.push('Moderate messaging frequency');
    }

    // Few messages but high risk
    if (participantData.messageCount < 10 && participantData.avgRiskScore > 30) {
      riskScore += 15;
      flags.push('Low message count but high risk content');
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, riskScore);

    return { score: riskScore, flags };
  }
}