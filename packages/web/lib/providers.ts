import { RiskLevel, riskLevelFromScore } from './detection-helpers';
import { createClient } from './supabase/server';
import { ApiKeysStorage } from './api-keys-storage';

const PROVIDER_HEADERS = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};

async function getApiKey(keyName: string): Promise<string | null> {
    // Try process.env first for performance
    if (process.env[keyName]) return process.env[keyName]!;

    // Fallback to DB/Memory storage
    try {
        const supabase = createClient();
        const storage = new ApiKeysStorage(supabase);
        return await storage.getKey(keyName);
    } catch (error) {
        console.warn(`Failed to fetch API key ${keyName} from storage`, error);
        // Try memory-only storage if supabase fails
        try {
             const storage = new ApiKeysStorage();
             return await storage.getKey(keyName);
        } catch (e) {
            return null;
        }
    }
}

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
        const key = await getApiKey('EMAILREP_API_KEY');
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
        const key = await getApiKey('NUMVERIFY_API_KEY');
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
    const alphaKey = await getApiKey('ALPHA_VANTAGE_API_KEY');
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

    const cmcKey = await getApiKey('COINMARKETCAP_API_KEY');
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
    // The user requested to replace HIBP with a simple asset existence check.
    // We reuse the trading provider logic to verify if the ticker exists.

    const identifier = targetIdentifier.trim().toUpperCase();

    // If targetType is 'email' or 'phone', we skip external verification as HIBP is removed.
    // The UI currently asks for Ticker/Asset Type, so this is the primary use case.
    if (targetType !== 'stock' && targetType !== 'crypto') {
        return null;
    }

    try {
        // Reuse the trading provider to check for existence
        const tradingData = await fetchTradingProvider(identifier);

        if (tradingData) {
            // Asset found and data retrieved -> Verified
            return {
                isVerified: true,
                verificationStatus: 'VERIFIED',
                overallConfidence: 95,
                riskLevel: 'LOW',
                summary: `Asset '${identifier}' successfully verified. Market data is available.`,
                keyFindings: [
                    `Asset found in ${targetType === 'crypto' ? 'CoinMarketCap' : 'Alpha Vantage'} database.`,
                    `Active trading data retrieved.`
                ],
                recommendations: [
                    'Proceed with standard due diligence.',
                    'Verify the exchange or platform you are using is legitimate.'
                ],
            } satisfies VeracityProviderPayload;
        } else {
            // Asset not found or API error -> Unverified
            return {
                isVerified: false,
                verificationStatus: 'UNVERIFIED',
                overallConfidence: 70,
                riskLevel: 'HIGH',
                summary: `Asset '${identifier}' could not be verified in major market databases.`,
                keyFindings: [
                    `Asset not found in ${targetType === 'crypto' ? 'CoinMarketCap' : 'Alpha Vantage'} database.`,
                    'No active trading data available.'
                ],
                recommendations: [
                    'Exercise extreme caution.',
                    'This could be a fake or delisted asset.',
                    'Do not transfer funds until verified by other sources.'
                ],
            } satisfies VeracityProviderPayload;
        }

    } catch (error) {
        console.warn('Veracity check (asset existence) failed', { err: error, targetIdentifier });
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
