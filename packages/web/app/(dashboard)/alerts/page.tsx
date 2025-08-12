'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  X
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
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case 'medium':
        return <Shield className="h-5 w-5 text-warning" />
      case 'info':
        return <Info className="h-5 w-5 text-info" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-success" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-destructive/20 bg-destructive/5'
      case 'high':
        return 'border-destructive/20 bg-destructive/5'
      case 'medium':
        return 'border-warning/20 bg-warning/5'
      case 'info':
        return 'border-info/20 bg-info/5'
      case 'low':
        return 'border-success/20 bg-success/5'
      default:
        return 'border-muted/20 bg-muted/5'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">Active</Badge>
      case 'acknowledged':
        return <Badge variant="warning">Acknowledged</Badge>
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>
      case 'viewed':
        return <Badge variant="secondary">Viewed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const activeAlerts = mockAlerts.filter(alert => alert.status === 'active').length
  const totalAlerts = mockAlerts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Bell className="mr-3 h-6 w-6" />
            Security Alerts
          </h1>
          <p className="text-muted-foreground">
            Real-time security notifications and threat alerts
          </p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Alert Settings
        </Button>
      </motion.div>

      {/* Alert Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-lg mr-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="font-medium text-lg">{activeAlerts}</div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-info/10 rounded-lg mr-3">
                <Bell className="h-5 w-5 text-info" />
              </div>
              <div>
                <div className="font-medium text-lg">{totalAlerts}</div>
                <div className="text-sm text-muted-foreground">Total Alerts</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium text-lg">4</div>
                <div className="text-sm text-muted-foreground">Protected Users</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-warning/10 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="font-medium text-lg">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Active Alerts */}
      {activeAlerts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {activeAlerts} active security alert{activeAlerts !== 1 ? 's' : ''} requiring immediate attention.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {mockAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${getAlertColor(alert.type)} hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Alert Content */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Alert Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.type)}
                    </div>

                    {/* Alert Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        {getStatusBadge(alert.status)}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {alert.message}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
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
                          <Button
                            key={actionIndex}
                            variant={actionIndex === 0 ? 'default' : 'outline'}
                            size="sm"
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <div className="flex-shrink-0 ml-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {mockAlerts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-muted-foreground">
              You'll see security alerts and notifications here when they occur.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}