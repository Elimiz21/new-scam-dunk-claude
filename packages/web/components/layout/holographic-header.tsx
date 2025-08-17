'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Shield, Menu, X, User, Settings, LogOut, Zap, Home, DollarSign, HeadphonesIcon, FileText, CreditCard, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function HolographicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Scan', href: '/scan', icon: Zap },
    { name: 'Features', href: '/#features', icon: FileText },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Support', href: '/support', icon: HeadphonesIcon },
  ]

  const userNavigation = [
    { name: 'My Account', href: '/account', icon: User },
    { name: 'Billing & Plan', href: '/billing', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help & Support', href: '/support', icon: HelpCircle },
  ]

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-gray-800">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Shield className="h-8 w-8 text-holo-cyan drop-shadow-lg" />
            <div className="absolute inset-0 rounded-full bg-holo-cyan/20 blur-xl animate-pulse" />
          </div>
          <span className="text-xl font-bold holo-text">Scam Dunk</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 transition-all hover:text-holo-cyan group"
            >
              <item.icon className="h-4 w-4 opacity-60 group-hover:opacity-100" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Desktop User Menu */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <Link
                  href="/scan"
                  className="holo-button px-4 py-2 text-sm"
                >
                  <Zap className="w-4 h-4 mr-2 inline" />
                  Start Scanning
                </Link>
                
                {/* User Avatar Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="relative w-10 h-10 rounded-full bg-gradient-to-br from-holo-cyan to-holo-cyan-light hover:from-holo-cyan-light hover:to-holo-cyan transition-all duration-300 flex items-center justify-center group"
                  >
                    <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                    <div className="absolute inset-0 rounded-full bg-holo-cyan/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 glass-card border border-gray-700 rounded-xl overflow-hidden"
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-holo-cyan to-holo-cyan-light flex items-center justify-center">
                              <span className="text-white font-bold">{getUserInitials()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          {userNavigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-holo-cyan transition-colors"
                            >
                              <item.icon className="w-4 h-4" />
                              {item.name}
                            </Link>
                          ))}
                        </div>
                        
                        {/* Logout */}
                        <div className="border-t border-gray-700 py-2">
                          <button
                            onClick={() => {
                              handleLogout()
                              setUserMenuOpen(false)
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-holo-red transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Mobile User Avatar & Menu Button */}
              <div className="flex items-center gap-3 md:hidden">
                <button
                  className="relative w-9 h-9 rounded-full bg-gradient-to-br from-holo-cyan to-holo-cyan-light flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </button>
                <button
                  className="text-gray-400 hover:text-holo-cyan transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <Link href="/login" className="text-gray-400 hover:text-holo-cyan transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="holo-button px-6 py-2">
                  Sign up
                </Link>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-400 hover:text-holo-cyan transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden glass-card border-t border-gray-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-6">
              {/* Navigation Links */}
              <div className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 text-base font-medium text-gray-400 hover:text-holo-cyan transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-800 pt-6">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-holo-cyan to-holo-cyan-light flex items-center justify-center">
                        <span className="text-white font-bold">
                          {getUserInitials()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-white">{user?.name}</div>
                        <div className="text-sm text-gray-400">{user?.email}</div>
                      </div>
                    </div>
                    
                    {/* User Navigation */}
                    {userNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 text-base font-medium text-gray-400 hover:text-holo-cyan transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 text-base font-medium text-holo-red hover:text-red-400 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link 
                      href="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center glass-button px-4 py-3"
                    >
                      Log in
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center holo-button px-4 py-3"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}