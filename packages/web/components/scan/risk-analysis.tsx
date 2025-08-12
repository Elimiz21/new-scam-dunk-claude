'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScanResult } from '@/lib/stores/scan-store'
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Mail, 
  Phone, 
  Link,
  DollarSign,
  Building,
  Brain,
  Target
} from 'lucide-react'

interface RiskAnalysisProps {
  analysis: ScanResult['analysis']
  riskScore: number
}

export function RiskAnalysis({ analysis, riskScore }: RiskAnalysisProps) {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <Users className="h-4 w-4" />
      case 'organization':
        return <Building className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'url':
        return <Link className="h-4 w-4" />
      case 'money':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'border-destructive/20 bg-destructive/5 text-destructive'
      case 'medium':
        return 'border-warning/20 bg-warning/5 text-warning'
      case 'low':
        return 'border-muted/20 bg-muted/5 text-muted-foreground'
      default:
        return 'border-muted/20 bg-muted/5 text-muted-foreground'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>
      case 'medium':
        return <Badge variant="warning" className="text-xs">Medium</Badge>
      case 'low':
        return <Badge variant="secondary" className="text-xs">Low</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-success'
      case 'negative':
        return 'text-destructive'
      case 'neutral':
      default:
        return 'text-muted-foreground'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success'
    if (confidence >= 60) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Risk Score Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of threat assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Risk Score */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{riskScore}%</div>
              <div className="text-sm text-muted-foreground mb-4">
                Overall Risk Score
              </div>
              <Progress value={riskScore} className="h-4" />
            </div>

            {/* Sentiment Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${getSentimentColor(analysis.sentiment.overall)}`}>
                  {analysis.sentiment.overall.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Sentiment
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${getConfidenceColor(analysis.sentiment.confidence)}`}>
                  {analysis.sentiment.confidence}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Confidence Level
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Patterns */}
      {analysis.suspiciousPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Suspicious Patterns
            </CardTitle>
            <CardDescription>
              Specific patterns that raised security concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.suspiciousPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getSeverityColor(pattern.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{pattern.pattern}</h4>
                    {getSeverityBadge(pattern.severity)}
                  </div>
                  <p className="text-sm opacity-80">
                    {pattern.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entities Detected */}
      {analysis.entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Entities Detected
            </CardTitle>
            <CardDescription>
              People, organizations, and contact information found in the conversation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.entities.map((entity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-muted/25 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getEntityIcon(entity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate capitalize">
                        {entity.type}
                      </p>
                      <Badge 
                        variant={entity.confidence >= 80 ? 'success' : entity.confidence >= 60 ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {entity.confidence}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {entity.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Risk Factor Breakdown
          </CardTitle>
          <CardDescription>
            Individual components contributing to the overall risk score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock risk factors - in real app these would come from the analysis */}
            {[
              { name: 'Urgency Language', score: riskScore > 70 ? 85 : 25, description: 'Pressure tactics and time-sensitive requests' },
              { name: 'Financial Requests', score: riskScore > 60 ? 90 : 10, description: 'Requests for money, gift cards, or financial information' },
              { name: 'Trust Building', score: riskScore > 50 ? 70 : 20, description: 'Attempts to build false trust and emotional connection' },
              { name: 'Identity Claims', score: riskScore > 40 ? 60 : 15, description: 'Claims of authority, celebrity, or official capacity' },
              { name: 'Communication Style', score: riskScore > 30 ? 45 : 35, description: 'Grammar, language patterns, and communication style' }
            ].map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className={`text-sm font-mono ${getConfidenceColor(factor.score)}`}>
                    {factor.score}%
                  </span>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}