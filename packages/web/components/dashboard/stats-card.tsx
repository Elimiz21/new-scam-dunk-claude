import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  description?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
  className,
}: StatsCardProps) {
  const getChangeColor = (type: StatsCardProps['changeType']) => {
    switch (type) {
      case 'positive':
        return 'text-success'
      case 'negative':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTrendIcon = (type: StatsCardProps['changeType']) => {
    if (type === 'positive') return TrendingUp
    if (type === 'negative') return TrendingDown
    return null
  }

  const TrendIcon = getTrendIcon(changeType)

  return (
    <Card className={cn('hover-lift', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1 text-xs">
          {TrendIcon && (
            <TrendIcon className={cn('h-3 w-3', getChangeColor(changeType))} />
          )}
          <span className={getChangeColor(changeType)}>{change}</span>
          {description && (
            <span className="text-muted-foreground">from {description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}