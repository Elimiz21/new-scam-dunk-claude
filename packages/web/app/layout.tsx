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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ocma.dev'),
  title: {
    default: 'OCMA - AI-Powered Social Media Management',
    template: '%s | OCMA'
  },
  description: 'Advanced AI technology for social media management and content optimization. Streamline your social media strategy.',
  keywords: ['social media management', 'AI content', 'social strategy', 'content optimization', 'marketing automation'],
  authors: [{ name: 'OCMA Team' }],
  creator: 'OCMA',
  publisher: 'OCMA',
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
    url: 'https://ocma.dev',
    title: 'OCMA - AI-Powered Social Media Management',
    description: 'Advanced AI technology for social media management and content optimization.',
    siteName: 'OCMA',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'OCMA - AI-Powered Social Media Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OCMA - AI-Powered Social Media Management',
    description: 'Advanced AI technology for social media management and content optimization.',
    images: ['/images/og-image.png'],
    creator: '@ocma',
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