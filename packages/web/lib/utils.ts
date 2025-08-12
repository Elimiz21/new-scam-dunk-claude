import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`
    }
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return formatDate(date)
  }
}

export function getRiskColor(riskLevel: string) {
  switch (riskLevel.toLowerCase()) {
    case 'low':
      return 'text-success border-success/20 bg-success/5'
    case 'medium':
      return 'text-warning border-warning/20 bg-warning/5'
    case 'high':
      return 'text-danger border-danger/20 bg-danger/5'
    case 'critical':
      return 'text-destructive border-destructive/20 bg-destructive/5'
    default:
      return 'text-muted-foreground border-border bg-muted/5'
  }
}

export function getRiskScore(level: string): number {
  switch (level.toLowerCase()) {
    case 'low':
      return 25
    case 'medium':
      return 50
    case 'high':
      return 75
    case 'critical':
      return 95
    default:
      return 0
  }
}