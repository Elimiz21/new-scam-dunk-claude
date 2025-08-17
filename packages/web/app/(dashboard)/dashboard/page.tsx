'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
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
  ArrowRight,
  Zap,
  Lock,
  Eye,
  UserCheck
} from 'lucide-react'
import Image from 'next/image'

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
      icon: Shield,
      severity: 'high'
    },
    {
      type: 'alert',
      title: 'New scam pattern detected',
      time: '1 hour ago',
      icon: AlertTriangle,
      severity: 'medium'
    },
    {
      type: 'family',
      title: 'Mom completed security training',
      time: '3 hours ago',
      icon: CheckCircle,
      severity: 'low'
    }
  ]

  const familyMembers = [
    { name: 'John Doe', status: 'Protected', initial: 'J', riskLevel: 'low' },
    { name: 'Jane Doe', status: 'Protected', initial: 'J', riskLevel: 'low' },
    { name: 'Mom', status: 'Protected', initial: 'M', riskLevel: 'medium' },
    { name: 'Dad', status: 'At Risk', initial: 'D', riskLevel: 'high' }
  ]

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return '#DB4545'
      case 'medium': return '#D2BA4C'
      case 'low': return '#2E8B57'
      default: return '#5D878F'
    }
  }

  const getRiskGradient = (level: string) => {
    switch(level) {
      case 'high': return 'linear-gradient(135deg, #DB4545, #ff6b6b)'
      case 'medium': return 'linear-gradient(135deg, #D2BA4C, #FFD700)'
      case 'low': return 'linear-gradient(135deg, #2E8B57, #3FE0A0)'
      default: return 'linear-gradient(135deg, #5D878F, #7FA8B0)'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-holo-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="holo-text">Good morning, John!</span>
          </h1>
          <p className="text-gray-400 text-lg">Your family's scam protection overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Scans', value: stats.totalScans, change: '+12%', icon: ScanLine, color: 'cyan' },
            { title: 'Threats Blocked', value: stats.threatsBlocked, change: '+3', icon: Shield, color: 'green' },
            { title: 'Risk Score', value: `${stats.riskScore}%`, change: 'Low Risk', icon: TrendingUp, color: 'amber' },
            { title: 'Family Members', value: stats.familyMembers, change: 'All protected', icon: Users, color: 'gray' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              {/* Holographic shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-gray-400">{stat.title}</span>
                <div className={`p-2 rounded-lg bg-holo-${stat.color}/20`}>
                  <stat.icon className={`w-5 h-5 text-holo-${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className={`text-sm text-holo-${stat.color}`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Bell className="w-5 h-5 text-holo-cyan" />
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-holo-cyan/30 transition-all"
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{ background: `${getSeverityColor(activity.severity)}20` }}
                  >
                    <activity.icon 
                      className="w-5 h-5"
                      style={{ color: getSeverityColor(activity.severity) }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{activity.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Risk Meter */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 text-center"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Risk Level</h2>
              <Activity className="w-5 h-5 text-holo-cyan" />
            </div>
            
            {/* Holographic Risk Gauge */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gauge-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${stats.riskScore * 5.5} 550`}
                  className="filter drop-shadow-lg"
                />
                <defs>
                  <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2E8B57" />
                    <stop offset="50%" stopColor="#1FB8CD" />
                    <stop offset="100%" stopColor="#3FE0A0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <div className="text-5xl font-bold holo-text">{stats.riskScore}%</div>
                  <div className="text-holo-green text-sm mt-2">Low Risk</div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm">
              Your family is well protected. Keep up the great work!
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: '/scan', icon: ScanLine, label: 'New Scan', primary: true },
              { href: '/chat-import', icon: Plus, label: 'Import Chat', primary: false },
              { href: '/alerts', icon: Bell, label: 'View Alerts', primary: false },
              { href: '/history', icon: Activity, label: 'View History', primary: false }
            ].map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={`
                  flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all
                  ${action.primary 
                    ? 'holo-button' 
                    : 'glass-card border border-gray-700 hover:border-holo-cyan/50 text-gray-300 hover:text-white'
                  }
                `}
              >
                <action.icon className="w-5 h-5" />
                {action.label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Family Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Family Overview</h2>
            <Users className="w-5 h-5 text-holo-cyan" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {familyMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-holo-cyan/30 transition-all group"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative overflow-hidden"
                  style={{ background: getRiskGradient(member.riskLevel) }}
                >
                  {/* Animated pulse for at-risk members */}
                  {member.riskLevel === 'high' && (
                    <div className="absolute inset-0 bg-white/20 animate-ping" />
                  )}
                  <span className="relative z-10">{member.initial}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{member.name}</p>
                  <p className={`text-xs mt-1 ${
                    member.status === 'Protected' ? 'text-holo-green' : 'text-holo-red'
                  }`}>
                    {member.status}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-holo-cyan transition-colors" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}