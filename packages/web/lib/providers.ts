import { RiskLevel, riskLevelFromScore } from './detection-helpers';

const PROVIDER_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};

async function postJson<T>(url: string, payload: unknown): Promise<T | null> {
    if (!url) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: PROVIDER_HEADERS,
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Provider responded with status ${response.status}`);
        }

        return (await response.json()) as T;
    } catch (error) {
        console.warn('External provider request failed', { err: error, url });
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export type ContactProviderPayload = {
    riskScore: number;
    riskLevel?: RiskLevel;
    confidence?: number;
    flags?: string[];
    recommendations?: string[];
};

type EmailRepResponse = {
    reputation?: string;
    suspicious?: boolean;
    references?: number;
    details?: Record<string, unknown>;
};

type NumverifyResponse = {
    success?: boolean;
    error?: { info?: string };
    valid?: boolean;
    line_type?: string | null;
    carrier?: string | null;
};

export async function fetchContactProvider(contactType: string, contactValue: string) {
    // Feature flag check (simplified: assume enabled if keys exist)

    if (contactType === 'email') {
        const key = process.env.EMAILREP_API_KEY;
        if (!key) return null;

        try {
            const response = await fetch(`https://emailrep.io/${encodeURIComponent(contactValue)}`, {
                headers: {
                    ...PROVIDER_HEADERS,
                    Key: key,
                },
            });

            if (!response.ok) {
                throw new Error(`EmailRep responded with status ${response.status}`);
            }

            const data = (await response.json()) as EmailRepResponse;
            const reputation = (data.reputation || 'medium') as string;
            const reputationMap: Record<string, number> = {
                low: 25,
                medium: 55,
                high: 80,
                'very high': 95,
            };

            const baseScore = reputationMap[reputation.toLowerCase()] ?? 55;
            const suspicious: string[] = [];

            if (data.suspicious) suspicious.push('emailrep_suspicious');
            if (data.details) {
                Object.entries(data.details).forEach(([keyName, value]) => {
                    if (value) suspicious.push(`detail:${keyName}`);
                });
            }

            return {
                riskScore: baseScore,
                riskLevel: riskLevelFromScore(baseScore),
                confidence: Math.min(100, 60 + (data.references || 0) * 5),
                flags: suspicious,
                recommendations:
                    baseScore >= 70
                        ? ['Do not engage', 'Verify identity through secondary channels']
                        : baseScore >= 50
                            ? ['Request additional verification', 'Monitor communication closely']
                            : ['Continue with standard caution'],
            } satisfies ContactProviderPayload;
        } catch (error) {
            console.warn('EmailRep query failed', { err: error });
            return null;
        }
    }

    if (contactType === 'phone') {
        const key = process.env.NUMVERIFY_API_KEY;
        if (!key) return null;

        try {
            const url = new URL('https://apilayer.net/api/validate');
            url.searchParams.set('access_key', key);
            url.searchParams.set('number', contactValue);
            url.searchParams.set('format', '1');

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Numverify responded with status ${response.status}`);
            }

            const data = (await response.json()) as NumverifyResponse;
            if (data.success === false && data.error) {
                throw new Error(data.error.info || 'Numverify error');
            }

            let riskScore = data.valid ? 40 : 85;
            const flags: string[] = [];

            if (!data.valid) {
                flags.push('invalid_number');
            }

            if (data.line_type === 'premium_rate') {
                riskScore = Math.max(riskScore, 80);
                flags.push('premium_rate_line');
            }

            if (data.carrier === null || data.carrier === '') {
                riskScore = Math.max(riskScore, 65);
                flags.push('unknown_carrier');
            }

            return {
                riskScore,
                riskLevel: riskLevelFromScore(riskScore),
                confidence: data.valid ? 80 : 60,
                flags,
                recommendations:
                    riskScore >= 70
                        ? ['Do not engage via this phone number', 'Verify through authorised support channels']
                        : ['Proceed with caution and verify identity'],
            } satisfies ContactProviderPayload;
        } catch (error) {
            console.warn('Numverify query failed', { err: error });
            return null;
        }
    }

    return null;
}

export type TradingProviderPayload = {
    riskScore: number;
    riskLevel?: RiskLevel;
    confidence?: number;
    summary?: string;
    keyFindings?: string[];
    recommendations?: string[];
};

type AlphaVantageQuote = {
    '05. price'?: string;
    '06. volume'?: string;
    '10. change percent'?: string;
};

type AlphaVantageResponse = {
    'Global Quote'?: AlphaVantageQuote;
};

type CoinMarketCapQuote = {
    price?: number;
    percent_change_24h?: number;
    market_cap_dominance?: number;
    market_cap?: number;
};

type CoinMarketCapResponse = {
    data?: Record<string, { quote?: { USD?: CoinMarketCapQuote } }>;
};

export async function fetchTradingProvider(symbol: string) {
    const alphaKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (alphaKey) {
        try {
            const url = new URL('https://www.alphavantage.co/query');
            url.searchParams.set('function', 'GLOBAL_QUOTE');
            url.searchParams.set('symbol', symbol.toUpperCase());
            url.searchParams.set('apikey', alphaKey);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`Alpha Vantage status ${response.status}`);
            }

            const data = (await response.json()) as AlphaVantageResponse;
            const quote = data['Global Quote'];
            if (!quote) throw new Error('Global Quote missing');

            const price = Number(quote['05. price']);
            const changePercent = parseFloat(String((quote['10. change percent'] ?? '0')).replace('%', ''));
            const volume = Number(quote['06. volume'] ?? 0);

            const volatilityScore = Math.min(100, Math.abs(changePercent) * 3 + (volume > 0 ? Math.log10(volume) * 5 : 0));
            const riskScore = Math.round((volatilityScore + (price > 0 && price < 1 ? 70 : 30)) / 2);
            const riskLevel = riskLevelFromScore(riskScore);

            return {
                riskScore,
                riskLevel,
                confidence: Math.min(100, 60 + Math.log10(volume + 1) * 8),
                summary:
                    riskLevel === 'HIGH'
                        ? 'Alpha Vantage indicates high short-term volatility.'
                        : riskLevel === 'MEDIUM'
                            ? 'Alpha Vantage indicates moderate price movement.'
                            : 'Alpha Vantage indicates relatively stable trading conditions.',
                keyFindings: [
                    `Latest price: ${price}`,
                    `Change percent: ${changePercent}%`,
                    `Volume: ${volume}`,
                ],
                recommendations:
                    riskLevel === 'HIGH'
                        ? ['Avoid entering new positions', 'Review market news']
                        : riskLevel === 'MEDIUM'
                            ? ['Use protective stops', 'Monitor intraday moves']
                            : ['Maintain standard trading discipline'],
            } satisfies TradingProviderPayload;
        } catch (error) {
            console.warn('Alpha Vantage quote failed', { err: error, symbol });
        }
    }

    const cmcKey = process.env.COINMARKETCAP_API_KEY;
    if (cmcKey) {
        try {
            const response = await fetch(
                `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbol.toUpperCase())}`,
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': cmcKey,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`CoinMarketCap status ${response.status}`);
            }

            const data = (await response.json()) as CoinMarketCapResponse;
            const entry = data?.data?.[symbol.toUpperCase()]?.quote?.USD;
            if (!entry) throw new Error('CoinMarketCap quote missing');

            const change24h = entry.percent_change_24h ?? 0;
            const dominance = entry.market_cap_dominance ?? 0;
            const riskScore = Math.min(100, Math.abs(change24h) * 2 + (100 - dominance));
            const riskLevel = riskLevelFromScore(riskScore);

            return {
                riskScore,
                riskLevel,
                confidence: Math.min(100, 60 + (entry.market_cap ? Math.log10(entry.market_cap) * 4 : 0)),
                summary:
                    riskLevel === 'HIGH'
                        ? 'CoinMarketCap indicates high volatility or low dominance.'
                        : riskLevel === 'MEDIUM'
                            ? 'CoinMarketCap indicates moderate market movement.'
                            : 'CoinMarketCap indicates relatively stable performance.',
                keyFindings: [
                    `Price: ${entry.price}`,
                    `24h change: ${change24h}%`,
                    `Market dominance: ${dominance}%`,
                ],
                recommendations:
                    riskLevel === 'HIGH'
                        ? ['Consider hedging or scaling out', 'Monitor liquidity closely']
                        : riskLevel === 'MEDIUM'
                            ? ['Stay alert for market news', 'Size positions conservatively']
                            : ['Maintain standard allocation practices'],
            } satisfies TradingProviderPayload;
        } catch (error) {
            console.warn('CoinMarketCap quote failed', { err: error, symbol });
        }
    }

    return null;
}

export type VeracityProviderPayload = {
    isVerified: boolean;
    verificationStatus?: string;
    overallConfidence?: number;
    riskLevel?: RiskLevel;
    summary?: string;
    keyFindings?: string[];
    recommendations?: string[];
};

export async function fetchVeracityProvider(targetType: string, targetIdentifier: string) {
    const identifier = targetIdentifier.trim().toLowerCase();
    const isEmail = targetType === 'email' || identifier.includes('@');

    if (!isEmail) {
        return null;
    }

    const apiKey = process.env.HIBP_API_KEY;
    if (!apiKey) {
        return null;
    }

    try {
        const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(identifier)}?truncateResponse=true`;
        const response = await fetch(url, {
            headers: {
                'hibp-api-key': apiKey,
                'user-agent': 'ScamDunk-Web/1.0',
            },
        });

        if (response.status === 404) {
            return {
                isVerified: true,
                verificationStatus: 'VERIFIED',
                overallConfidence: 90,
                riskLevel: 'LOW',
                summary: 'No breaches reported for this email address by Have I Been Pwned.',
                keyFindings: ['Email address not found in breach databases.'],
                recommendations: ['Continue monitoring for new breach disclosures.', 'Rotate passwords periodically.', 'Enable multi-factor authentication.'],
            } satisfies VeracityProviderPayload;
        }

        if (!response.ok) {
            throw new Error(`Have I Been Pwned responded with status ${response.status}`);
        }

        const breaches = (await response.json()) as Array<{
            Name?: string;
            BreachDate?: string;
            DataClasses?: string[];
        }>;

        const breachCount = Array.isArray(breaches) ? breaches.length : 0;

        if (!breachCount) {
            return {
                isVerified: true,
                verificationStatus: 'VERIFIED',
                overallConfidence: 88,
                riskLevel: 'LOW',
                summary: 'No breaches reported for this email address by Have I Been Pwned.',
                keyFindings: ['Email address not found in breach databases.'],
                recommendations: ['Continue monitoring for new breach disclosures.', 'Rotate passwords periodically.', 'Enable multi-factor authentication.'],
            } satisfies VeracityProviderPayload;
        }

        const riskScore = Math.min(100, 50 + breachCount * 15);
        const overallConfidence = Math.max(10, 100 - riskScore);
        const riskLevel = riskLevelFromScore(riskScore);

        const keyFindings = breaches.slice(0, 3).map((breach) => {
            const classes = breach.DataClasses?.slice(0, 3).join(', ') || 'Unknown data classes';
            return `${breach.Name ?? 'Unknown breach'} (${breach.BreachDate ?? 'unknown date'}) — data exposed: ${classes}`;
        });

        return {
            isVerified: false,
            verificationStatus: 'BREACHED',
            overallConfidence,
            riskLevel,
            summary:
                breachCount === 1
                    ? 'Email address appears in one known data breach.'
                    : `Email address appears in ${breachCount} known data breaches.`,
            keyFindings,
            recommendations:
                riskLevel === 'HIGH'
                    ? [
                        'Reset associated passwords immediately.',
                        'Enable multi-factor authentication on all linked accounts.',
                        'Monitor financial activity for suspicious behaviour.',
                    ]
                    : [
                        'Reset affected service passwords.',
                        'Enable multi-factor authentication.',
                        'Monitor for phishing attempts referencing the breach.',
                    ],
        } satisfies VeracityProviderPayload;
    } catch (error) {
        console.warn('Have I Been Pwned query failed', { err: error, targetIdentifier });
        return null;
    }
}

export function combineScores(baseScore: number, providerScore: number) {
    return Math.round((baseScore + providerScore) / 2);
}

export function mergeFlags(base: string[], external?: string[]) {
    if (!external || !external.length) return base;
    return Array.from(new Set([...base, ...external]));
}

export function deriveRiskLevel(score: number, fallback?: RiskLevel): RiskLevel {
    try {
        return riskLevelFromScore(score);
    } catch (error) {
        console.warn('Failed to derive risk level from score', { err: error, score });
        return fallback || 'LOW';
    }
}
