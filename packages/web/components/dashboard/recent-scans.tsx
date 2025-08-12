'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, getRiskColor } from '@/lib/utils'
import { FileText, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react'
import Link from 'next/link'

// Mock data - in real app, this would come from your scan store
const mockScans = [
  {
    id: '1',
    fileName: 'WhatsApp Chat Export - Mom.txt',
    riskLevel: 'high',
    riskScore: 85,
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    summary: 'Romance scam detected with suspicious financial requests'
  },
  {
    id: '2', 
    fileName: 'Facebook Messages - Dad.txt',
    riskLevel: 'low',
    riskScore: 15,
    status: 'completed',
    createdAt: '2024-01-14T15:45:00Z',
    summary: 'Normal conversation, no threats detected'
  },
  {
    id: '3',
    fileName: 'Instagram Chat - Sarah.txt',
    riskLevel: 'medium',
    riskScore: 45,
    status: 'processing',
    createdAt: '2024-01-13T09:15:00Z',
    summary: 'Analyzing for potential phishing attempts...'
  },
  {
    id: '4',
    fileName: 'Email Thread - Investment.txt',
    riskLevel: 'critical', 
    riskScore: 95,
    status: 'completed',
    createdAt: '2024-01-12T14:20:00Z',
    summary: 'Multiple fraud indicators: fake investment opportunity'
  },
  {
    id: '5',
    fileName: 'Text Messages - Unknown.txt',
    riskLevel: 'low',
    riskScore: 20,
    status: 'completed',
    createdAt: '2024-01-11T11:10:00Z',
    summary: 'Spam marketing messages, low threat level'
  }
]

export function RecentScans() {
  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-success" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string, riskLevel: string) => {
    if (status === 'processing') {
      return <Badge variant="secondary">Processing...</Badge>
    }
    
    switch (riskLevel.toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>
      case 'medium':
        return <Badge variant="warning">Medium Risk</Badge>
      case 'low':
        return <Badge variant="success">Low Risk</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              Latest scam detection results for your family
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/history">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockScans.map((scan) => (
            <div
              key={scan.id}
              className="group flex items-start space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-all cursor-pointer"
            >
              {/* File Icon & Risk Indicator */}
              <div className="flex-shrink-0 relative">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  {getRiskIcon(scan.riskLevel)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {scan.fileName}
                  </h4>
                  {getStatusBadge(scan.status, scan.riskLevel)}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {scan.summary}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(scan.createdAt)}</span>
                    {scan.status === 'completed' && (
                      <span>Risk Score: {scan.riskScore}%</span>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <Link href={`/history/${scan.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockScans.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No scans yet</p>
            <Button className="mt-4" asChild>
              <Link href="/scan">
                Create your first scan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}