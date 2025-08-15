import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ToastProvider } from '@/components/ui/toast'
import { QueryProvider } from '@/lib/providers/query-provider'
import { WebSocketProvider } from '@/lib/providers/websocket-provider'
import { AuthProvider } from '@/lib/providers/auth-provider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://scam-dunk-production.vercel.app'),
  title: {
    default: 'Scam Dunk - AI-Powered Scam Protection',
    template: '%s | Scam Dunk'
  },
  description: 'Advanced AI technology to protect you and your loved ones from scams, fraud, and online threats. Family protection made simple.',
  keywords: ['scam protection', 'fraud detection', 'AI security', 'family safety', 'elder protection', 'online safety'],
  authors: [{ name: 'Scam Dunk Team' }],
  creator: 'Scam Dunk',
  publisher: 'Scam Dunk',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scam-dunk-production.vercel.app',
    title: 'Scam Dunk - AI-Powered Scam Protection',
    description: 'Advanced AI technology to protect you and your loved ones from scams, fraud, and online threats.',
    siteName: 'Scam Dunk',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scam Dunk - AI-Powered Scam Protection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scam Dunk - AI-Powered Scam Protection',
    description: 'Advanced AI technology to protect you and your loved ones from scams, fraud, and online threats.',
    images: ['/images/og-image.png'],
    creator: '@scamdunk',
  },
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/favicon-16x16.png',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <WebSocketProvider>
                <div className="relative flex min-h-screen flex-col">
                  {children}
                </div>
                <ToastProvider />
              </WebSocketProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}