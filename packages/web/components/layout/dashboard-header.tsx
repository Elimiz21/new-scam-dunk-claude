'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from './theme-toggle'
import { useAuthStore } from '@/lib/stores/auth-store'
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  HelpCircle,
  Plus
} from 'lucide-react'
import Link from 'next/link'

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/scan': 'New Scan',
  '/history': 'Scan History',
  '/alerts': 'Alerts',
  '/family': 'Family Protection',
  '/settings': 'Settings',
}

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const pageName = pageNames[pathname] || 'Dashboard'

  const mockNotifications = [
    { id: 1, text: 'New high-risk scan detected', time: '2 min ago', type: 'critical' },
    { id: 2, text: 'Weekly report is ready', time: '1 hour ago', type: 'info' },
    { id: 3, text: 'Family member shared a scan', time: '3 hours ago', type: 'info' },
  ]

  const unreadCount = mockNotifications.length

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6">
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">{pageName}</h1>
      </div>

      {/* Search */}
      <div className="hidden sm:block">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Search scans, alerts..."
            className="block w-full pl-9 pr-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-x-4">
        {/* Quick actions */}
        <Button size="sm" className="hidden sm:flex" asChild>
          <Link href="/scan">
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Link>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">{notification.text}</span>
                  <Badge 
                    variant={notification.type === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {notification.type}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/alerts" className="w-full text-center text-sm text-primary">
                View all alerts
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="flex items-center">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 focus:text-red-600"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}