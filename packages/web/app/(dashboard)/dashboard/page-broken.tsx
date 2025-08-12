'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { RiskMeter } from '@/components/dashboard/risk-meter'
import { RecentScans } from '@/components/dashboard/recent-scans'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { FamilyOverview } from '@/components/dashboard/family-overview'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  ScanLine,
  Users,
  Bell,
  Activity
} from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function DashboardPage() {
  // Mock data - in real app, this would come from your API/store
  const stats = {
    totalScans: 127,
    threatsBlocked: 23,
    riskScore: 15,
    familyMembers: 4,
  }

  const recentAlerts = [
    {
      id: '1',
      type: 'high-risk',
      message: 'Suspicious romance scam detected in Maria\'s chat',
      timestamp: '2 hours ago',
      status: 'active'
    },
    {
      id: '2', 
      type: 'medium-risk',
      message: 'Potential phishing link shared in family group',
      timestamp: '1 day ago',
      status: 'resolved'
    },
    {
      id: '3',
      type: 'info',
      message: 'Weekly security report is ready',
      timestamp: '3 days ago',
      status: 'viewed'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-4"
      >
        <motion.div variants={fadeInUp}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Good morning! 👋</h1>
              <p className="text-muted-foreground">
                Your family is protected. Here's your security overview.
              </p>
            </div>
            <Button asChild>
              <Link href="/scan">
                <ScanLine className="mr-2 h-4 w-4" />
                New Scan
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={fadeInUp}>
            <StatsCard
              title="Total Scans"
              value={stats.totalScans.toString()}
              change="+12%"
              changeType="positive"
              icon={Activity}
              description="This month"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatsCard
              title="Threats Blocked"
              value={stats.threatsBlocked.toString()}
              change="-5%"
              changeType="positive"
              icon={Shield}
              description="This month"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatsCard
              title="Risk Score"
              value={`${stats.riskScore}%`}
              change="Low"
              changeType="positive"
              icon={AlertTriangle}
              description="Current level"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatsCard
              title="Family Members"
              value={stats.familyMembers.toString()}
              change="Protected"
              changeType="positive"
              icon={Users}
              description="Active users"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Recent Alerts
                </CardTitle>
                <CardDescription>
                  Latest security notifications for your family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {alert.type === 'high-risk' && (
                          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>
                        )}
                        {alert.type === 'medium-risk' && (
                          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          </div>
                        )}
                        {alert.type === 'info' && (
                          <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-info" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {alert.message}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <p className="text-xs text-muted-foreground">
                            {alert.timestamp}
                          </p>
                          <Badge
                            variant={
                              alert.status === 'active' 
                                ? 'destructive' 
                                : alert.status === 'resolved'
                                ? 'success'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/alerts">
                      View All Alerts
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <RecentScans />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Meter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RiskMeter score={stats.riskScore} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <QuickActions />
          </motion.div>

          {/* Family Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <FamilyOverview />
          </motion.div>
        </div>
      </div>
    </div>
  )
}