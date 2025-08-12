import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'
import { 
  Activity, 
  ScanLine, 
  AlertTriangle, 
  Users, 
  Shield,
  FileText,
  Settings
} from 'lucide-react'

// Mock activity data
const mockActivities = [
  {
    id: '1',
    type: 'scan_completed',
    title: 'Scan completed for Maria',
    description: 'High-risk romance scam detected in WhatsApp messages',
    user: { name: 'Maria Rodriguez', avatar: '' },
    timestamp: '2024-01-15T10:30:00Z',
    severity: 'high'
  },
  {
    id: '2',
    type: 'family_joined',
    title: 'New family member added',
    description: 'Sarah Johnson joined your family protection plan',
    user: { name: 'Sarah Johnson', avatar: '' },
    timestamp: '2024-01-14T15:45:00Z',
    severity: 'info'
  },
  {
    id: '3',
    type: 'alert_resolved',
    title: 'Alert resolved',
    description: 'Phishing attempt alert has been marked as resolved',
    user: { name: 'System', avatar: '' },
    timestamp: '2024-01-14T09:15:00Z',
    severity: 'success'
  },
  {
    id: '4',
    type: 'scan_started',
    title: 'New scan initiated',
    description: 'Robert started analyzing Instagram chat messages',
    user: { name: 'Robert Chen', avatar: '' },
    timestamp: '2024-01-13T14:20:00Z',
    severity: 'info'
  },
  {
    id: '5',
    type: 'settings_updated',
    title: 'Security settings updated',
    description: 'Notification preferences have been modified',
    user: { name: 'You', avatar: '' },
    timestamp: '2024-01-12T11:10:00Z',
    severity: 'info'
  }
]

export function ActivityFeed() {
  const getActivityIcon = (type: string, severity: string) => {
    switch (type) {
      case 'scan_completed':
        return <ScanLine className={`h-4 w-4 ${
          severity === 'high' ? 'text-destructive' : 
          severity === 'medium' ? 'text-warning' : 'text-success'
        }`} />
      case 'scan_started':
        return <FileText className="h-4 w-4 text-info" />
      case 'family_joined':
        return <Users className="h-4 w-4 text-success" />
      case 'alert_resolved':
        return <Shield className="h-4 w-4 text-success" />
      case 'settings_updated':
        return <Settings className="h-4 w-4 text-info" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>
      case 'medium':
        return <Badge variant="warning" className="text-xs">Medium</Badge>
      case 'success':
        return <Badge variant="success" className="text-xs">Success</Badge>
      case 'info':
      default:
        return <Badge variant="secondary" className="text-xs">Info</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          Recent activity across your family's protection network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 pb-4 last:pb-0"
            >
              {/* Timeline line */}
              {index < mockActivities.length - 1 && (
                <div className="absolute left-6 mt-8 h-6 w-px bg-border" />
              )}
              
              {/* Activity icon */}
              <div className="flex-shrink-0 relative">
                <div className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  {getActivityIcon(activity.type, activity.severity)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  {getSeverityBadge(activity.severity)}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.name} • {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockActivities.length === 0 && (
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}