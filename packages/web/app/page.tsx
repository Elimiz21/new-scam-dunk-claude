'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { 
  Shield, 
  Users, 
  Zap, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  ArrowRight,
  Lock,
  Brain,
  Clock,
  Heart
} from 'lucide-react'
import Link from 'next/link'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
}

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms detect sophisticated scam patterns in real-time."
    },
    {
      icon: MessageSquare,
      title: "Chat Screenshot Analysis",
      description: "Upload screenshots of suspicious conversations for instant threat assessment."
    },
    {
      icon: Shield,
      title: "Real-Time Protection",
      description: "Continuous monitoring and instant alerts when potential threats are detected."
    },
    {
      icon: Users,
      title: "Family Protection",
      description: "Protect your entire family with shared monitoring and emergency contacts."
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Round-the-clock protection with immediate notifications for urgent threats."
    },
    {
      icon: Heart,
      title: "Senior-Friendly",
      description: "Designed specifically for seniors with simple, accessible interface."
    }
  ]

  const testimonials = [
    {
      name: "Margaret Thompson",
      age: 68,
      text: "Scam Dunk helped me avoid losing $5,000 to a fake IRS scam. The alert came just in time!",
      rating: 5
    },
    {
      name: "Robert Chen",
      age: 72,
      text: "My daughter set this up for me. It's so easy to use and gives me peace of mind.",
      rating: 5
    },
    {
      name: "Linda Williams",
      age: 65,
      text: "The AI caught a romance scam that I almost fell for. This app is a lifesaver!",
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: "Personal",
      price: 9.99,
      description: "Perfect for individual protection",
      features: [
        "Personal scam detection",
        "Chat screenshot analysis",
        "Real-time alerts",
        "24/7 support",
        "Monthly reports"
      ]
    },
    {
      name: "Family",
      price: 19.99,
      description: "Protect your entire family",
      features: [
        "Up to 5 family members",
        "Shared monitoring dashboard",
        "Emergency contact system",
        "Priority support",
        "Advanced AI analysis",
        "Family activity reports"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: 39.99,
      description: "Maximum protection for large families",
      features: [
        "Unlimited family members",
        "Advanced threat intelligence",
        "Custom alert settings",
        "White-glove setup",
        "Dedicated support",
        "API access"
      ]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-info text-white">
        <div className="container mx-auto px-4 py-20 sm:py-24">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.h1 
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
              variants={fadeInUp}
            >
              Protect Your Family from{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Scams & Fraud
              </span>
            </motion.h1>
            
            <motion.p 
              className="mx-auto mb-8 max-w-2xl text-xl text-blue-100"
              variants={fadeInUp}
            >
              Advanced AI technology designed specifically for seniors and families. 
              Analyze suspicious messages, detect scams instantly, and stay protected 24/7.
            </motion.p>
            
            <motion.div 
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
              variants={fadeInUp}
            >
              <Button size="xl" variant="secondary" className="group" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Advanced Protection Made Simple
            </h2>
            <p className="text-xl text-muted-foreground">
              Our AI-powered platform provides comprehensive protection against all types of scams and fraud.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover-lift">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              How Scam Dunk Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to complete protection
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                step: 1,
                title: "Upload Screenshot",
                description: "Take a screenshot of suspicious messages, emails, or websites and upload them to our secure platform.",
                icon: MessageSquare
              },
              {
                step: 2,
                title: "AI Analysis",
                description: "Our advanced AI analyzes the content for scam patterns, suspicious language, and known fraud indicators.",
                icon: Brain
              },
              {
                step: 3,
                title: "Get Instant Results",
                description: "Receive immediate risk assessment with detailed explanations and recommendations for next steps.",
                icon: CheckCircle
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-white">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-xl font-semibold">
                  Step {item.step}: {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Trusted by Families Everywhere
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Scam Dunk has helped protect our users from fraud and scams.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-4 flex">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="mb-4 italic">"{testimonial.text}"</p>
                    <div className="font-semibold">
                      {testimonial.name}, {testimonial.age}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Choose Your Protection Plan
            </h2>
            <p className="text-xl text-muted-foreground">
              Affordable protection for every family size
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-primary ring-2 ring-primary' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="mr-3 h-5 w-5 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="mt-8 w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      asChild
                    >
                      <Link href="/register">
                        Start Free Trial
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-info py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            className="mx-auto max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
              Don't Wait for Scammers to Strike
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Join thousands of families who trust Scam Dunk to keep them safe. 
              Start your free trial today and experience the peace of mind you deserve.
            </p>
            <Button size="xl" variant="secondary" className="group" asChild>
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}