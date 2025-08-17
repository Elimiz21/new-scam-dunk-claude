'use client'

import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/utils'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Clock,
  Users,
  Shield,
  Settings,
  Eye,
  X,
  Zap,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

// Mock alert data
const mockAlerts = [
  {
    id: '1',
    type: 'critical',
    title: 'Critical Threat Detected',
    message: 'Romance scam detected in Maria\'s WhatsApp conversation with suspicious financial requests.',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'active',
    user: 'Maria Rodriguez',
    scanId: '1',
    actions: ['Block Contact', 'Report Scam', 'Notify Family']
  },
  {
    id: '2',
    type: 'high',
    title: 'Phishing Link Detected',
    message: 'Suspicious link shared in family group chat - potential phishing attempt.',
    timestamp: '2024-01-14T15:45:00Z',
    status: 'acknowledged',
    user: 'Family Group',
    scanId: '2',
    actions: ['Block Link', 'Warn Family']
  },
  {
    id: '3',
    type: 'medium',
    title: 'Suspicious Contact Attempt',
    message: 'Unknown number attempted contact with investment opportunity claims.',
    timestamp: '2024-01-13T09:15:00Z',
    status: 'resolved',
    user: 'Robert Chen',
    scanId: '3',
    actions: ['Block Number']
  },
  {
    id: '4',
    type: 'info',
    title: 'Security Update Available',
    message: 'New fraud patterns have been added to the AI detection system.',
    timestamp: '2024-01-12T14:20:00Z',
    status: 'viewed',
    user: 'System',
    scanId: null,
    actions: ['Update Settings']
  },
  {
    id: '5',
    type: 'low',
    title: 'Weekly Security Report Ready',
    message: 'Your family\'s weekly security summary is now available for review.',
    timestamp: '2024-01-11T11:10:00Z',
    status: 'viewed',
    user: 'System',
    scanId: null,
    actions: ['View Report']
  }
]

export default function AlertsPage() {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'medium':
        return <Shield className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      case 'low':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertGradient = (type: string) => {
    switch (type) {
      case 'critical':
        return 'from-holo-red via-red-600 to-holo-red'
      case 'high':
        return 'from-holo-amber via-amber-500 to-holo-amber-light'
      case 'medium':
        return 'from-holo-gray via-gray-600 to-holo-gray-light'
      case 'info':
        return 'from-holo-cyan via-cyan-500 to-holo-cyan-light'
      case 'low':
        return 'from-holo-green via-green-600 to-holo-green-light'
      default:
        return 'from-gray-600 via-gray-500 to-gray-400'
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-holo-red/30 bg-holo-red/5'
      case 'high':
        return 'border-holo-amber/30 bg-holo-amber/5'
      case 'medium':
        return 'border-holo-gray/30 bg-holo-gray/5'
      case 'info':
        return 'border-holo-cyan/30 bg-holo-cyan/5'
      case 'low':
        return 'border-holo-green/30 bg-holo-green/5'
      default:
        return 'border-gray-700 bg-gray-800/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-holo-red bg-holo-red/20 border-holo-red/50'
      case 'acknowledged':
        return 'text-holo-amber bg-holo-amber/20 border-holo-amber/50'
      case 'resolved':
        return 'text-holo-green bg-holo-green/20 border-holo-green/50'
      case 'viewed':
        return 'text-gray-400 bg-gray-800/50 border-gray-700'
      default:
        return 'text-gray-400 bg-gray-800/50 border-gray-700'
    }
  }

  const activeAlerts = mockAlerts.filter(alert => alert.status === 'active').length
  const totalAlerts = mockAlerts.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-holo-red/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Bell className="mr-3 h-8 w-8 text-holo-cyan" />
              <span className="holo-text">Security Alerts</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time security notifications and threat alerts
            </p>
          </div>
          <button className="glass-card px-6 py-2 text-gray-300 border border-gray-700 hover:border-holo-cyan/50 hover:text-white transition-all flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Settings
          </button>
        </motion.div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: AlertTriangle, value: activeAlerts, label: 'Active Alerts', color: 'red', pulse: true },
            { icon: Bell, value: totalAlerts, label: 'Total Alerts', color: 'cyan', pulse: false },
            { icon: Shield, value: 4, label: 'Protected Users', color: 'green', pulse: false },
            { icon: Clock, value: '24/7', label: 'Monitoring', color: 'amber', pulse: false }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-holo-${stat.color}/20 relative`}>
                  {stat.pulse && (
                    <div className="absolute inset-0 bg-holo-red/40 rounded-xl animate-ping" />
                  )}
                  <stat.icon className={`h-6 w-6 text-holo-${stat.color} relative z-10`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Alerts Warning */}
        {activeAlerts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 border-2 border-holo-red/50 bg-holo-red/10 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <AlertTriangle className="h-5 w-5 text-holo-red" />
                <div className="absolute inset-0 bg-holo-red/40 blur-sm animate-pulse" />
              </div>
              <p className="text-white">
                You have <span className="font-bold text-holo-red">{activeAlerts}</span> active security alert{activeAlerts !== 1 ? 's' : ''} requiring immediate attention.
              </p>
            </div>
          </motion.div>
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          {mockAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`glass-card p-6 ${getAlertColor(alert.type)} hover:shadow-xl transition-all group`}
            >
              <div className="flex items-start justify-between">
                {/* Alert Content */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Alert Icon with Gradient Background */}
                  <div className="relative">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${getAlertGradient(alert.type)} opacity-20`} />
                    <div className="absolute inset-0 p-3">
                      {getAlertIcon(alert.type)}
                    </div>
                  </div>

                  {/* Alert Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg text-white">{alert.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4">
                      {alert.message}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {alert.user}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                      {alert.scanId && (
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          Scan #{alert.scanId}
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      {alert.actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${actionIndex === 0 
                              ? 'holo-button' 
                              : 'glass-card border border-gray-700 hover:border-holo-cyan/50 text-gray-300 hover:text-white'
                            }
                          `}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button className="ml-4 p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Holographic Line Effect on Hover */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {mockAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="relative inline-block mb-4">
              <Bell className="h-16 w-16 text-gray-600" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-holo-green rounded-full animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No alerts yet</h3>
            <p className="text-gray-400">
              You'll see security alerts and notifications here when they occur.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}