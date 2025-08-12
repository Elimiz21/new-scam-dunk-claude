import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ScanLine, 
  Users, 
  FileDown, 
  Settings, 
  HelpCircle,
  Bell
} from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    title: 'New Scan',
    description: 'Upload chat or email',
    icon: ScanLine,
    href: '/scan',
    color: 'bg-primary/10 text-primary hover:bg-primary/20'
  },
  {
    title: 'Invite Family',
    description: 'Add family member',
    icon: Users,
    href: '/family',
    color: 'bg-success/10 text-success hover:bg-success/20'
  },
  {
    title: 'Export Report',
    description: 'Download PDF report',
    icon: FileDown,
    href: '/reports',
    color: 'bg-info/10 text-info hover:bg-info/20'
  },
  {
    title: 'Alert Settings',
    description: 'Configure notifications',
    icon: Bell,
    href: '/settings#alerts',
    color: 'bg-warning/10 text-warning hover:bg-warning/20'
  },
  {
    title: 'Security Settings',
    description: 'Update preferences',
    icon: Settings,
    href: '/settings',
    color: 'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20'
  },
  {
    title: 'Get Help',
    description: 'Contact support',
    icon: HelpCircle,
    href: '/help',
    color: 'bg-muted/10 text-muted-foreground hover:bg-muted/20'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-start space-y-2 hover-lift"
              asChild
            >
              <Link href={action.href}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}