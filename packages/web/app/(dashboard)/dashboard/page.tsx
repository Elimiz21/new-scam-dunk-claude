'use client'

import Link from 'next/link'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  ScanLine,
  Users,
  Bell,
  Activity,
  Plus,
  ArrowRight
} from 'lucide-react'

// Consistent inline styles
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  header: {
    marginBottom: '32px'
  },
  greeting: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  statTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280'
  },
  statIcon: {
    width: '20px',
    height: '20px',
    color: '#3b82f6'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px'
  },
  statChange: {
    fontSize: '0.875rem',
    color: '#059669'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    marginBottom: '32px'
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937'
  },
  riskMeter: {
    textAlign: 'center' as const,
    padding: '32px'
  },
  riskScore: {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: '8px'
  },
  riskLabel: {
    fontSize: '1.125rem',
    color: '#6b7280',
    marginBottom: '16px'
  },
  riskDescription: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.5'
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    border: 'none',
    cursor: 'pointer'
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db'
  },
  activityFeed: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  activityIcon: {
    width: '20px',
    height: '20px',
    marginTop: '2px'
  },
  activityContent: {
    flex: 1
  },
  activityTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px'
  },
  activityTime: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  familyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  familyMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600'
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '2px'
  },
  memberStatus: {
    fontSize: '0.75rem',
    color: '#059669'
  }
}

export default function DashboardPage() {
  // Mock data
  const stats = {
    totalScans: 127,
    threatsBlocked: 23,
    riskScore: 15,
    familyMembers: 4,
  }

  const recentActivity = [
    {
      type: 'scan',
      title: 'Suspicious WhatsApp message blocked',
      time: '2 minutes ago',
      icon: Shield
    },
    {
      type: 'alert',
      title: 'New scam pattern detected',
      time: '1 hour ago',
      icon: AlertTriangle
    },
    {
      type: 'family',
      title: 'Mom completed security training',
      time: '3 hours ago',
      icon: CheckCircle
    }
  ]

  const familyMembers = [
    { name: 'John Doe', status: 'Protected', initial: 'J' },
    { name: 'Jane Doe', status: 'Protected', initial: 'J' },
    { name: 'Mom', status: 'Protected', initial: 'M' },
    { name: 'Dad', status: 'At Risk', initial: 'D' }
  ]

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.greeting}>Good morning, John!</h1>
          <p style={styles.subtitle}>Here's your family's scam protection overview</p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Total Scans</span>
              <ScanLine style={styles.statIcon} />
            </div>
            <div style={styles.statValue}>{stats.totalScans}</div>
            <div style={styles.statChange}>+12% from last week</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Threats Blocked</span>
              <Shield style={styles.statIcon} />
            </div>
            <div style={styles.statValue}>{stats.threatsBlocked}</div>
            <div style={styles.statChange}>+3 this week</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Risk Score</span>
              <TrendingUp style={styles.statIcon} />
            </div>
            <div style={styles.statValue}>{stats.riskScore}%</div>
            <div style={styles.statChange}>Low Risk</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <span style={styles.statTitle}>Family Members</span>
              <Users style={styles.statIcon} />
            </div>
            <div style={styles.statValue}>{stats.familyMembers}</div>
            <div style={styles.statChange}>All protected</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Recent Activity */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Recent Activity</h2>
              <Bell style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </div>
            <div style={styles.activityFeed}>
              {recentActivity.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <activity.icon style={styles.activityIcon} />
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>{activity.title}</div>
                    <div style={styles.activityTime}>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Meter */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Risk Level</h2>
              <Activity style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </div>
            <div style={styles.riskMeter}>
              <div style={styles.riskScore}>{stats.riskScore}%</div>
              <div style={styles.riskLabel}>Low Risk</div>
              <p style={styles.riskDescription}>
                Your family is well protected. Keep up the great work with regular scans!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Quick Actions</h2>
          </div>
          <div style={styles.quickActions}>
            <Link href="/scan" style={styles.actionButton}>
              <ScanLine style={{ width: '20px', height: '20px' }} />
              New Scan
            </Link>
            <Link 
              href="/chat-import" 
              style={{...styles.actionButton, ...styles.actionButtonSecondary}}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
              Import Chat
            </Link>
            <Link 
              href="/alerts" 
              style={{...styles.actionButton, ...styles.actionButtonSecondary}}
            >
              <Bell style={{ width: '20px', height: '20px' }} />
              View Alerts
            </Link>
            <Link 
              href="/history" 
              style={{...styles.actionButton, ...styles.actionButtonSecondary}}
            >
              <Activity style={{ width: '20px', height: '20px' }} />
              View History
            </Link>
          </div>
        </div>

        {/* Family Overview */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Family Overview</h2>
            <Users style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </div>
          <div style={styles.familyGrid}>
            {familyMembers.map((member, index) => (
              <div key={index} style={styles.familyMember}>
                <div style={styles.avatar}>
                  {member.initial}
                </div>
                <div style={styles.memberInfo}>
                  <div style={styles.memberName}>{member.name}</div>
                  <div style={{
                    ...styles.memberStatus,
                    color: member.status === 'Protected' ? '#059669' : '#dc2626'
                  }}>
                    {member.status}
                  </div>
                </div>
                <ArrowRight style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}