import crypto from 'crypto';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

const suspiciousEmailDomains = new Set([
    'gmail.scam',
    'fraudmail.com',
    'risky.biz',
    'fastprofit.io',
    'suspicious.co',
]);

const suspiciousPhonePrefixes = ['+247', '+355', '+381', '+505', '+809'];
const highRiskTradingSymbols = new Set(['GME', 'AMC', 'LUNA', 'SHIB', 'DOGE']);
const mediumRiskTradingSymbols = new Set(['TSLA', 'BTC', 'ETH', 'SOL', 'ADA']);
const riskyVeracityIndicators = ['unregistered', 'shell', 'no-license', 'offshore'];
const riskyChatKeywords = [
    'guaranteed return',
    'wire transfer',
    'urgent',
    'confidential',
    'double your money',
    'crypto gift',
    'verification code',
    'seed phrase',
    'wallet',
    'investment',
    'pay now',
    'lottery',
    'scam',
];

const scoreFromString = (input: string, modulo = 100) => {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const numeric = parseInt(hash.slice(0, 8), 16);
    return numeric % (modulo + 1);
};

export const riskLevelFromScore = (score: number): RiskLevel => {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
};

export const assessContact = (contactType: string, contactValue: string) => {
    const normalizedValue = String(contactValue).trim().toLowerCase();
    let riskScore = scoreFromString(normalizedValue);
    let isScammer = false;
    const details: string[] = [];

    if (contactType === 'email') {
        const domain = normalizedValue.split('@')[1] || '';
        if (suspiciousEmailDomains.has(domain)) {
            riskScore = Math.min(100, riskScore + 30);
            isScammer = true;
            details.push('Domain flagged as high risk');
        }
        if (domain.endsWith('.ru') || domain.endsWith('.cn')) {
            riskScore = Math.min(100, riskScore + 15);
            details.push('Email domain from higher-risk region');
        }
    }

    if (contactType === 'phone') {
        if (suspiciousPhonePrefixes.some((code) => normalizedValue.startsWith(code))) {
            riskScore = Math.min(100, riskScore + 20);
            isScammer = true;
            details.push('Phone number uses known scam prefix');
        }
    }

    if (riskScore >= 65) {
        isScammer = true;
    }

    const riskLevel = riskLevelFromScore(riskScore);

    return {
        contactType,
        contactValue,
        isScammer,
        riskScore,
        riskLevel,
        confidence: 70 + scoreFromString(`${normalizedValue}:confidence`, 30),
        verificationSources: ['truecaller', 'numverify'],
        flags: isScammer ? ['potential_scam_pattern'] : [],
        recommendations:
            riskLevel === 'HIGH'
                ? ['Do not engage', 'Verify identity through official channels']
                : riskLevel === 'MEDIUM'
                    ? ['Request additional verification', 'Monitor the interaction closely']
                    : ['Interaction appears low risk', 'Keep routine security hygiene'],
        details,
    };
};

export const analyzeChat = (platform: string, messages: Array<{ text: string }> = []) => {
    const joined = messages.map((m) => m.text || '').join(' ').toLowerCase();
    const suspiciousMentions = riskyChatKeywords.filter((keyword) => joined.includes(keyword));
    const uppercaseBursts = messages.filter((msg) => /[A-Z]{4,}/.test(msg.text || '')).length;
    const messageCount = messages.length;

    const baseScore = scoreFromString(`${platform}:${joined}`);
    let riskScore = baseScore;

    if (suspiciousMentions.length) {
        riskScore = Math.min(100, riskScore + suspiciousMentions.length * 8);
    }
    if (uppercaseBursts > Math.max(2, messageCount * 0.1)) {
        riskScore = Math.min(100, riskScore + 10);
    }

    const riskLevel = riskLevelFromScore(riskScore);

    return {
        platform,
        overallRiskScore: riskScore,
        riskLevel,
        confidence: 60 + scoreFromString(`${platform}:${messageCount}`, 35),
        summary:
            riskLevel === 'HIGH'
                ? 'Conversation exhibits multiple high-risk indicators.'
                : riskLevel === 'MEDIUM'
                    ? 'Conversation includes warning signs. Proceed with caution.'
                    : 'Conversation appears routine with limited risk factors.',
        keyFindings: [
            `${messageCount} messages analyzed`,
            suspiciousMentions.length
                ? `${suspiciousMentions.length} suspicious phrases detected`
                : 'No suspicious phrases detected',
            uppercaseBursts ? `${uppercaseBursts} messages with aggressive tone` : 'Tone remains neutral',
        ],
        recommendations:
            riskLevel === 'HIGH'
                ? ['Stop the conversation', 'Report to Scam Dunk support']
                : riskLevel === 'MEDIUM'
                    ? ['Verify sender identity', 'Avoid sharing personal data']
                    : ['Maintain normal caution', 'Educate participants on security best practices'],
        suspiciousMentions,
    };
};

export const analyzeTrading = (symbolRaw: string) => {
    const symbol = symbolRaw.toUpperCase();
    let riskScore = scoreFromString(symbol, 100);
    const notes: string[] = [];

    if (highRiskTradingSymbols.has(symbol)) {
        riskScore = Math.max(riskScore, 75);
        notes.push('Symbol frequently associated with speculative volatility.');
    }

    if (mediumRiskTradingSymbols.has(symbol)) {
        riskScore = Math.max(riskScore, 55);
        notes.push('Symbol experiences regular market swings.');
    }

    if (/^[A-Z]{4,}$/.test(symbol)) {
        riskScore = Math.min(100, riskScore + 10);
        notes.push('Non-standard ticker length, may indicate low liquidity.');
    }

    const riskLevel = riskLevelFromScore(riskScore);

    return {
        symbol,
        overallRiskScore: riskScore,
        riskLevel,
        confidence: 65 + scoreFromString(`${symbol}:confidence`, 30),
        summary:
            riskLevel === 'HIGH'
                ? 'Trading activity suggests high volatility or potential manipulation.'
                : riskLevel === 'MEDIUM'
                    ? 'Asset shows elevated volatility patterns. Review fundamentals.'
                    : 'Asset risk profile appears within typical ranges.',
        keyFindings: notes.length ? notes : ['No abnormal trading indicators detected.'],
        recommendations:
            riskLevel === 'HIGH'
                ? ['Avoid entering new positions', 'Review historical price action in detail']
                : riskLevel === 'MEDIUM'
                    ? ['Use protective stops', 'Limit exposure size']
                    : ['Maintain standard trading discipline'],
    };
};

export const checkVeracity = (targetIdentifier: string, targetType: string) => {
    const normalized = targetIdentifier.toLowerCase();
    let confidence = 70 + scoreFromString(normalized, 30);
    let isVerified = true;
    const findings: string[] = [];

    if (riskyVeracityIndicators.some((indicator) => normalized.includes(indicator))) {
        isVerified = false;
        confidence = Math.max(20, confidence - 30);
        findings.push('Identifier includes language associated with shell or unregistered entities.');
    }

    if (normalized.includes('sec') || normalized.includes('gov')) {
        findings.push('Identifier references regulatory keyword.');
    }

    const overallConfidence = Math.min(100, confidence);
    const riskLevel: RiskLevel = overallConfidence < 45 ? 'HIGH' : overallConfidence < 65 ? 'MEDIUM' : 'LOW';

    return {
        targetType,
        targetIdentifier,
        isVerified,
        verificationStatus: isVerified ? 'VERIFIED' : 'UNVERIFIED',
        overallConfidence,
        riskLevel,
        summary: isVerified
            ? 'Entity passes heuristic verification checks.'
            : 'Entity failed heuristic verification checks.',
        keyFindings: findings.length ? findings : ['No adverse indicators detected.'],
        recommendations: isVerified
            ? ['Maintain standard due diligence cadence.']
            : ['Request official documentation', 'Verify with regulatory databases'],
    };
};
