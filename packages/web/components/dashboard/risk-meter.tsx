'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react'

interface RiskMeterProps {
  score: number // 0-100
  className?: string
}

export function RiskMeter({ score, className }: RiskMeterProps) {
  const riskLevel = useMemo(() => {
    if (score <= 25) return { level: 'Low', color: 'success', icon: CheckCircle }
    if (score <= 50) return { level: 'Medium', color: 'warning', icon: Shield }
    if (score <= 75) return { level: 'High', color: 'destructive', icon: AlertTriangle }
    return { level: 'Critical', color: 'destructive', icon: AlertTriangle }
  }, [score])

  const getRiskDescription = (level: string) => {
    switch (level) {
      case 'Low':
        return 'Your family is well protected with minimal risk exposure.'
      case 'Medium':
        return 'Some potential risks detected. Review recent activities.'
      case 'High':
        return 'Several risk factors identified. Take immediate action.'
      case 'Critical':
        return 'Urgent attention required. Multiple high-risk threats detected.'
      default:
        return ''
    }
  }

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-success'
      case 'Medium':
        return 'bg-warning'
      case 'High':
        return 'bg-destructive'
      case 'Critical':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  const Icon = riskLevel.icon

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className="mr-2 h-5 w-5" />
          Risk Assessment
        </CardTitle>
        <CardDescription>
          Current family security risk level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Display */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">{score}%</div>
          <Badge 
            variant={riskLevel.color as any} 
            className="mb-3"
          >
            {riskLevel.level} Risk
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Risk Level</span>
            <span>{score}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={score} 
              className="h-3"
            />
            {/* Custom progress fill with risk-appropriate color */}
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(riskLevel.level)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <div className="text-sm font-medium">Risk Factors:</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suspicious Messages</span>
              <span className={score > 50 ? 'text-destructive' : 'text-success'}>
                {score > 50 ? 'High' : 'Low'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phishing Attempts</span>
              <span className={score > 30 ? 'text-warning' : 'text-success'}>
                {score > 30 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Family Exposure</span>
              <span className={score > 25 ? 'text-warning' : 'text-success'}>
                {score > 25 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {getRiskDescription(riskLevel.level)}
          </p>
        </div>

        {/* Action Recommendations */}
        {score > 50 && (
          <div className="p-3 border border-warning/20 bg-warning/5 rounded-lg">
            <div className="text-sm font-medium text-warning mb-1">
              Recommended Actions:
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Review recent family scans</li>
              <li>• Update security settings</li>
              <li>• Educate family members on current threats</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}