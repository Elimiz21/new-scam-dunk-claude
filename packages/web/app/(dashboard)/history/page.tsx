'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime, formatBytes } from '@/lib/utils'
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Download,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  ScanLine
} from 'lucide-react'
import Link from 'next/link'

// Mock data - in real app, this would come from your scan store
const mockScanHistory = [
  {
    id: '1',
    fileName: 'WhatsApp Chat Export - Mom.txt',
    riskLevel: 'high',
    riskScore: 85,
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:32:15Z',
    fileSize: 2048,
    summary: 'Romance scam detected with suspicious financial requests',
    redFlags: 5,
    user: 'Maria Rodriguez'
  },
  {
    id: '2', 
    fileName: 'Facebook Messages - Dad.txt',
    riskLevel: 'low',
    riskScore: 15,
    status: 'completed',
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T15:47:30Z',
    fileSize: 1024,
    summary: 'Normal conversation, no threats detected',
    redFlags: 0,
    user: 'Robert Chen'
  },
  {
    id: '3',
    fileName: 'Instagram Chat - Sarah.txt',
    riskLevel: 'medium',
    riskScore: 45,
    status: 'completed',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:18:45Z',
    fileSize: 3072,
    summary: 'Suspicious link sharing detected',
    redFlags: 2,
    user: 'Sarah Johnson'
  },
  {
    id: '4',
    fileName: 'Email Thread - Investment.txt',
    riskLevel: 'critical', 
    riskScore: 95,
    status: 'completed',
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-12T14:25:10Z',
    fileSize: 4096,
    summary: 'Multiple fraud indicators: fake investment opportunity',
    redFlags: 8,
    user: 'You'
  },
  {
    id: '5',
    fileName: 'Text Messages - Unknown.txt',
    riskLevel: 'low',
    riskScore: 20,
    status: 'completed',
    createdAt: '2024-01-11T11:10:00Z',
    updatedAt: '2024-01-11T11:12:05Z',
    fileSize: 512,
    summary: 'Spam marketing messages, low threat level',
    redFlags: 1,
    user: 'You'
  }
]

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const filteredScans = mockScanHistory.filter(scan => {
    const matchesSearch = scan.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scan.summary.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterLevel === 'all' || scan.riskLevel === filterLevel
    return matchesSearch && matchesFilter
  })

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

  const getRiskBadge = (level: string) => {
    switch (level.toLowerCase()) {
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

  const handleDeleteScan = (scanId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete scan:', scanId)
  }

  const handleDownloadReport = (scanId: string) => {
    // TODO: Implement download functionality
    console.log('Download report:', scanId)
  }

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
            <History className="mr-3 h-6 w-6" />
            Scan History
          </h1>
          <p className="text-muted-foreground">
            View and manage all your previous scam detection scans
          </p>
        </div>
        <Button asChild>
          <Link href="/scan">
            <ScanLine className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans by filename or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Risk Level Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="min-w-[120px]">
                    <Filter className="mr-2 h-4 w-4" />
                    {filterLevel === 'all' ? 'All Risks' : `${filterLevel} Risk`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterLevel('all')}>
                    All Risk Levels
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterLevel('critical')}>
                    Critical Risk
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterLevel('high')}>
                    High Risk
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterLevel('medium')}>
                    Medium Risk
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterLevel('low')}>
                    Low Risk
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm text-muted-foreground">
          Showing {filteredScans.length} of {mockScanHistory.length} scans
          {searchQuery && ` matching "${searchQuery}"`}
          {filterLevel !== 'all' && ` with ${filterLevel} risk level`}
        </p>
      </motion.div>

      {/* Scan History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredScans.length > 0 ? (
          filteredScans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Main Content */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* File Icon & Risk Indicator */}
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getRiskIcon(scan.riskLevel)}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold truncate mr-4">
                            {scan.fileName}
                          </h3>
                          {getRiskBadge(scan.riskLevel)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {scan.summary}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Risk Score: {scan.riskScore}%</span>
                          <span>Size: {formatBytes(scan.fileSize)}</span>
                          <span>Red Flags: {scan.redFlags}</span>
                          <span>By: {scan.user}</span>
                          <span>{formatRelativeTime(scan.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/history/${scan.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadReport(scan.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteScan(scan.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Scan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scans found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterLevel !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : "You haven't run any scans yet"
                }
              </p>
              {!searchQuery && filterLevel === 'all' && (
                <Button asChild>
                  <Link href="/scan">
                    <ScanLine className="mr-2 h-4 w-4" />
                    Create your first scan
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Summary Stats */}
      {mockScanHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary Statistics</CardTitle>
              <CardDescription>
                Overview of your scanning activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{mockScanHistory.length}</div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {mockScanHistory.filter(s => ['critical', 'high'].includes(s.riskLevel)).length}
                  </div>
                  <div className="text-sm text-muted-foreground">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {mockScanHistory.filter(s => s.riskLevel === 'medium').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {mockScanHistory.filter(s => s.riskLevel === 'low').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Low Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}