'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Brain, 
  Users, 
  Zap, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  FileSearch,
  TrendingUp,
  Globe
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms detect scams with 95%+ accuracy'
    },
    {
      icon: Shield,
      title: 'Real-Time Protection',
      description: 'Instant alerts when suspicious content is detected'
    },
    {
      icon: Users,
      title: 'Family Safety',
      description: 'Protect your entire family with multi-user accounts'
    },
    {
      icon: Globe,
      title: 'Blockchain Verification',
      description: 'Verify crypto tokens and smart contracts instantly'
    },
    {
      icon: MessageSquare,
      title: 'Chat Import',
      description: 'Upload WhatsApp, Telegram, and other chat exports for analysis'
    },
    {
      icon: Lock,
      title: 'Bank-Grade Security',
      description: 'Your data is encrypted and never shared with third parties'
    }
  ]

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '95%+', label: 'Detection Accuracy' },
    { value: '<100ms', label: 'Response Time' },
    { value: '24/7', label: 'Monitoring' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <motion.div 
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="container relative mx-auto px-4"
        >
          <motion.div variants={fadeInUp} className="text-center">
            <Badge className="mb-4" variant="secondary">
              <Zap className="mr-1 h-3 w-3" />
              AI-Powered Protection
            </Badge>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Stop Scams Before
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {' '}They Strike
              </span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Advanced AI technology protects you and your loved ones from cryptocurrency scams, 
              pig-butchering schemes, and online fraud. Family protection made simple.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/register" className="flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Stats */}
          <motion.div 
            variants={fadeInUp}
            className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold mb-4">
              Comprehensive Protection Suite
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect yourself and your family from online scams
            </motion.p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold mb-4">
              How It Works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">
              Three simple steps to complete protection
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            <motion.div variants={fadeInUp} className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileSearch className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">1. Upload Content</h3>
              <p className="text-muted-foreground">
                Upload chat logs, messages, or enter suspicious text
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Brain className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">2. AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI instantly analyzes content for scam patterns
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">3. Get Protected</h3>
              <p className="text-muted-foreground">
                Receive instant alerts and detailed risk assessments
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-12 text-center text-primary-foreground"
          >
            <AlertTriangle className="mx-auto mb-4 h-12 w-12" />
            <h2 className="mb-4 text-3xl font-bold">
              Don't Wait Until It's Too Late
            </h2>
            <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
              Scammers are getting more sophisticated every day. Protect yourself and your 
              family with AI-powered scam detection.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register" className="flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur" asChild>
                <Link href="/dashboard">
                  View Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">Scam Dunk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Scam Dunk. Protecting families worldwide.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}