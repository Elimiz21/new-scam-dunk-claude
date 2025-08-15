'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Inline styles for production - deployed August 14, 2025
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  hero: {
    background: 'linear-gradient(to bottom, #3b82f6, #1e40af)',
    color: 'white',
    padding: '80px 20px 120px',
    textAlign: 'center' as const
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    marginBottom: '24px'
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 'bold',
    marginBottom: '24px',
    lineHeight: '1.1'
  },
  subtitle: {
    fontSize: '1.25rem',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto 32px',
    lineHeight: '1.6'
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '64px'
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    color: '#1e40af',
    border: 'none'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '2px solid rgba(255,255,255,0.3)'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '32px',
    marginTop: '64px'
  },
  stat: {
    textAlign: 'center' as const
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '0.875rem',
    opacity: 0.8
  },
  section: {
    padding: '80px 20px',
    backgroundColor: '#ffffff'
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '16px',
    color: '#1f2937'
  },
  sectionSubtitle: {
    fontSize: '1.125rem',
    textAlign: 'center' as const,
    color: '#6b7280',
    maxWidth: '600px',
    margin: '0 auto 48px'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '48px'
  },
  feature: {
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    color: '#3b82f6',
    marginBottom: '16px'
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1f2937'
  },
  featureDescription: {
    color: '#6b7280',
    lineHeight: '1.6'
  },
  cta: {
    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center' as const
  },
  footer: {
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    padding: '48px 20px',
    textAlign: 'center' as const,
    color: '#6b7280'
  }
}
import { 
  Shield, 
  Brain, 
  Users, 
  Zap, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  FileSearch,
  Globe,
  TrendingUp,
  Search,
  UserCheck,
  LineChart
} from 'lucide-react'

export default function LandingPage() {
  const mainFeatures = [
    {
      icon: UserCheck,
      title: 'Contact Verification',
      description: 'Verify group members, managers, and contacts against international scammer databases. Check phone numbers, emails, and workplace information.',
      highlights: ['International databases', 'Phone & email verification', 'Workplace validation']
    },
    {
      icon: MessageSquare,
      title: 'Chat Language Analysis',
      description: 'Detect psychological manipulation patterns and scam language using advanced AI to identify red flags in conversations.',
      highlights: ['Manipulation detection', 'Psychological patterns', 'Scam phrases']
    },
    {
      icon: TrendingUp,
      title: 'Trading Activity Analysis',
      description: 'Identify irregular trading patterns, pump-and-dump schemes, and market manipulation using smart AI analysis.',
      highlights: ['Volume anomalies', 'Price manipulation', 'News correlation']
    },
    {
      icon: Shield,
      title: 'Stock/Crypto Veracity',
      description: 'Verify existence and legitimacy of stocks and cryptocurrencies against law enforcement and regulatory databases.',
      highlights: ['Existence verification', 'Law enforcement check', 'Regulatory compliance']
    }
  ]

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms detect scams with 95%+ accuracy'
    },
    {
      icon: Shield,
      title: 'Real-Time Protection',
      description: 'Instant alerts when suspicious content is detected'
    },
    {
      icon: Users,
      title: 'Family Safety',
      description: 'Protect your entire family with multi-user accounts'
    }
  ]

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.badge}>
            <Zap style={{ marginRight: '4px', width: '12px', height: '12px' }} />
            AI-Powered Protection
          </div>
          
          <h1 style={styles.title}>
            Before investing, Use Scam Dunk
          </h1>
          
          <p style={styles.subtitle}>
            Protect yourself from investment scams with our comprehensive 4-test detection system. 
            Verify contacts, analyze conversations, check trading patterns, and validate investments.
          </p>
          
          <div style={styles.buttonContainer}>
            <Link href="/register" style={{...styles.button, ...styles.primaryButton}}>
              Get Started Free
              <ArrowRight style={{ marginLeft: '8px', width: '16px', height: '16px' }} />
            </Link>
            <Link href="/login" style={{...styles.button, ...styles.secondaryButton}}>
              Sign In
            </Link>
          </div>

          {/* Hero Stats */}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statValue}>99.9%</div>
              <div style={styles.statLabel}>Uptime SLA</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>95%+</div>
              <div style={styles.statLabel}>Detection Accuracy</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>&lt;100ms</div>
              <div style={styles.statLabel}>Response Time</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>24/7</div>
              <div style={styles.statLabel}>Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Test System Section */}
      <section style={{...styles.section, backgroundColor: '#f0f9ff'}}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>
            4 Powerful Detection Tests
          </h2>
          <p style={styles.sectionSubtitle}>
            Run comprehensive scam detection with our advanced 4-test system. Use all tests together or select specific checks.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginTop: '48px'
          }}>
            {mainFeatures.map((feature, index) => (
              <Link 
                key={index} 
                href="/scan"
                style={{
                  padding: '32px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '2px solid #e0f2fe',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e0f2fe';
                }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <feature.icon style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  marginBottom: '12px', 
                  color: '#1e293b' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: '#64748b', 
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  fontSize: '0.95rem'
                }}>
                  {feature.description}
                </p>
                <div style={{ marginTop: '16px' }}>
                  {feature.highlights.map((highlight, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <CheckCircle style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: '#10b981',
                        marginRight: '8px',
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Test {index + 1}
                </div>
              </Link>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '48px',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #e0f2fe'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px', color: '#1e293b' }}>
              Run All Tests Simultaneously
            </h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Get comprehensive protection with our one-click scan that runs all 4 tests and provides a detailed risk assessment.
            </p>
            <Link href="/scan" style={{
              ...styles.button,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '14px 32px',
              fontSize: '1.1rem',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Try Comprehensive Scan
              <ArrowRight style={{ marginLeft: '8px', width: '20px', height: '20px' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>
            Additional Protection Features
          </h2>
          <p style={styles.sectionSubtitle}>
            Beyond our 4-test system, enjoy these powerful features
          </p>

          <div style={styles.features}>
            {features.map((feature, index) => (
              <div key={index} style={styles.feature}>
                <feature.icon style={styles.featureIcon} />
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.container}>
          <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
            Don't Wait Until It's Too Late
          </h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            Scammers are getting more sophisticated every day. Protect yourself and your 
            family with AI-powered scam detection.
          </p>
          <div style={styles.buttonContainer}>
            <Link href="/register" style={{...styles.button, backgroundColor: 'rgba(255,255,255,0.9)', color: '#1e40af'}}>
              Start Free Trial
              <ArrowRight style={{ marginLeft: '8px', width: '16px', height: '16px' }} />
            </Link>
            <Link href="/scan" style={{...styles.button, ...styles.secondaryButton}}>
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
            <span style={{ fontWeight: '600', color: '#1f2937' }}>Scam Dunk</span>
          </div>
          <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
            © 2024 Scam Dunk. Protecting investors worldwide.
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <Link href="/privacy" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
              Privacy
            </Link>
            <Link href="/terms" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
              Terms
            </Link>
            <Link href="/contact" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}