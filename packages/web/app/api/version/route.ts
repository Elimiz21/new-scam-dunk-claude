import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.1.0',
    buildDate: '2025-08-23T10:45:00Z',
    features: {
      pricing: {
        freeTrial: true,
        payPerScan: '$4.99',
        personal: '$9.99/month',
        family: '$19.99/month',
        teams: '$49.99/month'
      },
      apis: {
        primaryCrypto: 'CoinMarketCap',
        scammerDatabases: 12,
        newDatabases: [
          'FBI IC3',
          'INTERPOL',
          'ScamAlert Singapore',
          'Scamwatch Australia',
          'Action Fraud UK',
          'PhishTank',
          'VirusTotal',
          'Google Safe Browsing',
          'URLVoid',
          'AbuseIPDB',
          'BBB Scam Tracker',
          'APWG eCrime Exchange'
        ]
      }
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}