'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RiskAnalysis } from './risk-analysis'
import { ScanResult } from '@/lib/stores/scan-store'
import { formatRelativeTime, getRiskColor } from '@/lib/utils'
import { 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Download, 
  Share2,
  ScanLine,
  Shield,
  Eye,
  Clock,
  User
} from 'lucide-react'

interface ScanResultsProps {
  scan: ScanResult
  onNewScan: () => void
}

export function ScanResults({ scan, onNewScan }: ScanResultsProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return 'text-destructive border-destructive/20 bg-destructive/5'
      case 'high':
        return 'text-destructive border-destructive/20 bg-destructive/5'
      case 'medium':
        return 'text-warning border-warning/20 bg-warning/5'
      case 'low':
        return 'text-success border-success/20 bg-success/5'
      default:
        return 'text-muted-foreground border-muted/20 bg-muted/5'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />
      case 'low':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  const getRiskMessage = (level: string, score: number) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return {
          title: 'CRITICAL THREAT DETECTED',
          message: 'This conversation contains severe fraud indicators. Take immediate action and do not engage further.'
        }
      case 'high':
        return {
          title: 'HIGH RISK DETECTED', 
          message: 'Multiple scam indicators found. Exercise extreme caution and consider this likely fraudulent.'
        }
      case 'medium':
        return {
          title: 'MEDIUM RISK DETECTED',
          message: 'Some suspicious patterns detected. Be cautious and verify any requests independently.'
        }
      case 'low':
        return {
          title: 'LOW RISK - LIKELY SAFE',
          message: 'No significant threat indicators found. This conversation appears to be legitimate.'
        }
      default:
        return {
          title: 'ANALYSIS COMPLETE',
          message: 'The scan has been completed successfully.'
        }
    }
  }

  const riskMessage = getRiskMessage(scan.riskLevel, scan.riskScore)

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    console.log('Downloading report for scan:', scan.id)
  }

  const handleShareResults = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing results for scan:', scan.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Results Card */}
      <Card className={getRiskLevelColor(scan.riskLevel)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getRiskIcon(scan.riskLevel)}
              <div>
                <CardTitle className="text-lg">{riskMessage.title}</CardTitle>
                <CardDescription className="mt-1">
                  Risk Score: {scan.riskScore}% • {scan.riskLevel.toUpperCase()} Risk Level
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={scan.riskLevel === 'low' ? 'success' : 'destructive'}
              className="text-sm"
            >
              {scan.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className={getRiskLevelColor(scan.riskLevel)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Security Assessment</AlertTitle>
            <AlertDescription>
              {riskMessage.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Scan Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">File Name</div>
                <div className="text-sm">{scan.chatFile.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">File Size</div>
                <div className="text-sm">{(scan.chatFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">File Type</div>
                <div className="text-sm capitalize">{scan.chatFile.type.split('/')[1]}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Scan Date</div>
                <div className="text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatRelativeTime(scan.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Scanned By</div>
                <div className="text-sm flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  You
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="text-sm">
                  <Badge variant="success" className="text-xs">Completed</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>
            AI-powered analysis of the conversation content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              {scan.analysis.summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Risk Analysis */}
      <RiskAnalysis analysis={scan.analysis} riskScore={scan.riskScore} />

      {/* Red Flags */}
      {scan.analysis.redFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Red Flags Detected
            </CardTitle>
            <CardDescription>
              Specific warning signs identified in the conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {scan.analysis.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-info">
            <Shield className="mr-2 h-5 w-5" />
            Recommended Actions
          </CardTitle>
          <CardDescription>
            Steps you should take based on this analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {scan.analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onNewScan} className="flex-1">
          <ScanLine className="mr-2 h-4 w-4" />
          Scan Another File
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          
          <Button variant="outline" onClick={handleShareResults}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Results
          </Button>
        </div>
      </div>
    </motion.div>
  )
}