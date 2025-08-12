'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useWebSocket } from '@/lib/providers/websocket-provider'
import { 
  ScanLine, 
  Brain, 
  Shield, 
  AlertTriangle,
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface ScanProgressProps {
  progress: number
  onComplete: () => void
}

const scanStages = [
  {
    id: 'upload',
    name: 'File Upload',
    description: 'Uploading and processing file',
    icon: FileText,
    duration: 2000
  },
  {
    id: 'analysis',
    name: 'AI Analysis',
    description: 'Analyzing content for scam patterns',
    icon: Brain,
    duration: 5000
  },
  {
    id: 'threat_detection',
    name: 'Threat Detection',
    description: 'Scanning for known fraud indicators',
    icon: AlertTriangle,
    duration: 3000
  },
  {
    id: 'risk_assessment',
    name: 'Risk Assessment',
    description: 'Calculating risk score and recommendations',
    icon: Shield,
    duration: 2000
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Scan completed successfully',
    icon: CheckCircle,
    duration: 500
  }
]

export function ScanProgress({ progress: initialProgress, onComplete }: ScanProgressProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const { connected } = useWebSocket()

  useEffect(() => {
    // Simulate realistic progress
    const totalDuration = scanStages.reduce((sum, stage) => sum + stage.duration, 0)
    let elapsed = 0
    
    const interval = setInterval(() => {
      elapsed += 100
      const overallProgress = Math.min((elapsed / totalDuration) * 100, 95)
      setProgress(overallProgress)

      // Calculate current stage
      let stageStart = 0
      let newCurrentStage = 0
      
      for (let i = 0; i < scanStages.length; i++) {
        const stageEnd = stageStart + (scanStages[i].duration / totalDuration) * 100
        if (overallProgress >= stageStart && overallProgress < stageEnd) {
          newCurrentStage = i
          const stageProgressPercent = ((overallProgress - stageStart) / (stageEnd - stageStart)) * 100
          setStageProgress(Math.min(stageProgressPercent, 100))
          break
        }
        stageStart = stageEnd
      }

      if (newCurrentStage !== currentStage) {
        setCurrentStage(newCurrentStage)
        setStageProgress(0)
      }

      // Complete the scan
      if (elapsed >= totalDuration) {
        clearInterval(interval)
        setProgress(100)
        setCurrentStage(scanStages.length - 1)
        setStageProgress(100)
        setTimeout(() => {
          onComplete()
        }, 1000)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [currentStage, onComplete])

  const getCurrentStage = () => scanStages[currentStage]
  const CurrentStageIcon = getCurrentStage().icon

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mr-3"
            >
              <ScanLine className="h-6 w-6 text-primary" />
            </motion.div>
            Analyzing Your Content
          </CardTitle>
          <CardDescription>
            Our AI is carefully examining your files for potential threats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Current Stage */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <motion.div
              animate={currentStage < scanStages.length - 1 ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CurrentStageIcon className="h-6 w-6 text-primary" />
              </div>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{getCurrentStage().name}</h4>
                <Badge variant="secondary">{Math.round(stageProgress)}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getCurrentStage().description}
              </p>
            </div>
          </div>

          {/* Stage List */}
          <div className="space-y-3">
            {scanStages.map((stage, index) => {
              const StageIcon = stage.icon
              const isCompleted = index < currentStage
              const isCurrent = index === currentStage
              const isPending = index > currentStage
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex items-center space-x-3 p-2 rounded-lg transition-all
                    ${isCurrent ? 'bg-primary/5 border border-primary/20' : ''}
                    ${isCompleted ? 'opacity-75' : ''}
                    ${isPending ? 'opacity-50' : ''}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-colors
                    ${isCompleted ? 'bg-success text-success-foreground' : ''}
                    ${isCurrent ? 'bg-primary text-primary-foreground' : ''}
                    ${isPending ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <StageIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{stage.name}</div>
                    <div className="text-xs text-muted-foreground">{stage.description}</div>
                  </div>
                  {isCompleted && (
                    <Badge variant="success" className="text-xs">Complete</Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs">Processing...</Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-destructive'}`} />
            <span>
              {connected ? 'Connected to secure analysis servers' : 'Reconnecting...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="flex items-center p-4">
          <Shield className="h-5 w-5 text-info mr-3 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-info mb-1">
              Secure Processing
            </div>
            <div className="text-muted-foreground">
              Your files are processed using end-to-end encryption and will be automatically 
              deleted after analysis for maximum privacy protection.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}