import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Plus, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Mock family data - in real app, this would come from your family store
const mockFamilyMembers = [
  {
    id: '1',
    name: 'Maria Rodriguez',
    email: 'maria@email.com',
    role: 'Mom',
    avatar: '',
    status: 'protected',
    riskLevel: 'low',
    lastScan: '2 days ago',
    scansCount: 12
  },
  {
    id: '2',
    name: 'Robert Chen',
    email: 'robert@email.com', 
    role: 'Dad',
    avatar: '',
    status: 'protected',
    riskLevel: 'high',
    lastScan: '1 hour ago',
    scansCount: 8
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    role: 'Daughter',
    avatar: '',
    status: 'protected',
    riskLevel: 'medium',
    lastScan: '5 days ago', 
    scansCount: 3
  }
]

export function FamilyOverview() {
  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High Risk</Badge>
      case 'medium':
        return <Badge variant="warning" className="text-xs">Medium</Badge>
      case 'low':
        return <Badge variant="success" className="text-xs">Low Risk</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-destructive" />
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-warning" />
      case 'low':
        return <Shield className="h-3 w-3 text-success" />
      default:
        return <Shield className="h-3 w-3 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Family Protection
            </CardTitle>
            <CardDescription>
              Security status of family members
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/family">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockFamilyMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role} • {member.scansCount} scans
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRiskIcon(member.riskLevel)}
                    {getRiskBadge(member.riskLevel)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    Last scan: {member.lastScan}
                  </span>
                  <Badge 
                    variant={member.status === 'protected' ? 'success' : 'secondary'}
                    className="text-xs"
                  >
                    {member.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockFamilyMembers.length === 0 && (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No family members added yet</p>
            <Button asChild>
              <Link href="/family">
                <Plus className="h-4 w-4 mr-2" />
                Add Family Member
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Protection Status</span>
            <div className="flex items-center space-x-1">
              <Shield className="h-4 w-4 text-success" />
              <span className="font-medium">Family Protected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}