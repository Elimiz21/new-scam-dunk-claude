'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  Shield,
  LayoutDashboard,
  ScanLine,
  History,
  Bell,
  Settings,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Scan', href: '/scan', icon: ScanLine },
  { name: 'History', href: '/history', icon: History },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Family', href: '/family', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const supportLinks = [
  { name: 'Help Center', href: '/help', icon: HelpCircle },
]

export function DashboardSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 text-sm font-semibold leading-6">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="gradient-text">Scam Dunk</span>
          </Link>
        </div>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
              <motion.div
                className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="gradient-text font-semibold">Scam Dunk</span>
                  </Link>
                  <button
                    type="button"
                    className="-m-2.5 rounded-md p-2.5 text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="mt-6">
                  <SidebarContent 
                    pathname={pathname} 
                    onItemClick={() => setMobileMenuOpen(false)}
                    user={user}
                    onLogout={handleLogout}
                  />
                </nav>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 py-6">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold gradient-text">Scam Dunk</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <SidebarContent 
              pathname={pathname} 
              user={user}
              onLogout={handleLogout}
            />
          </nav>
        </div>
      </div>
    </>
  )
}

interface SidebarContentProps {
  pathname: string
  user: any
  onLogout: () => void
  onItemClick?: () => void
}

function SidebarContent({ pathname, user, onLogout, onItemClick }: SidebarContentProps) {
  return (
    <div className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all hover-lift',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-6 w-6 shrink-0',
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </li>

        <li>
          <div className="text-xs font-semibold leading-6 text-muted-foreground">
            Support
          </div>
          <ul role="list" className="-mx-2 mt-2 space-y-1">
            {supportLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all hover-lift"
                >
                  <item.icon className="h-6 w-6 shrink-0 text-muted-foreground group-hover:text-primary" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </li>

        <li className="mt-auto">
          <div className="flex flex-col space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 border rounded-md">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user?.subscription?.plan || 'Free'} Plan
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              className="justify-start px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              onClick={() => {
                onLogout()
                onItemClick?.()
              }}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </li>
      </ul>
    </div>
  )
}