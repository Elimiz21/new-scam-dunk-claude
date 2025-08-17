'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import HeroSection from '@/components/holographic/HeroSection'
import TestCard from '@/components/holographic/TestCard'

export default function LandingPage() {
  const testFeatures = [
    {
      title: 'Contact Verification',
      description: 'Verify phone numbers, emails, and names against international scammer databases.',
      icon: '/icons/contact-verification.svg',
      href: '/scan/contact',
      color: 'from-holo-cyan to-holo-cyan-light',
    },
    {
      title: 'Chat Language Analysis',
      description: 'Detect psychological manipulation patterns and scam language using advanced AI.',
      icon: '/icons/chat-analysis.svg',
      href: '/scan/chat',
      color: 'from-holo-green to-holo-green-light',
    },
    {
      title: 'Trading Activity Analysis',
      description: 'Identify irregular trading patterns, pump-and-dump schemes, and market manipulation.',
      icon: '/icons/trading-activity.svg',
      href: '/scan/trading',
      color: 'from-holo-gray to-holo-gray-light',
    },
    {
      title: 'Stock/Crypto Veracity',
      description: 'Verify existence and legitimacy of stocks and cryptocurrencies.',
      icon: '/icons/asset-veracity.svg',
      href: '/scan/veracity',
      color: 'from-holo-amber to-holo-amber-light',
    },
  ]

  const stats = [
    { value: '99.9%', label: 'Uptime SLA', icon: '🛡️' },
    { value: '95%+', label: 'Detection Accuracy', icon: '🎯' },
    { value: '<100ms', label: 'Response Time', icon: '⚡' },
    { value: '24/7', label: 'Monitoring', icon: '🔍' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Hero Section */}
      <HeroSection />

      {/* 4-Test System Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="holo-text">4 Powerful Detection Tests</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive protection with our advanced verification system.
              Run tests individually or all at once.
            </p>
          </motion.div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {testFeatures.map((feature, index) => (
              <TestCard key={index} {...feature} index={index} />
            ))}
          </div>

          {/* Comprehensive Scan CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-white">
              Run All Tests Simultaneously
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Get comprehensive protection with our one-click scan that runs all 4 tests
              and provides a detailed risk assessment.
            </p>
            <Link href="/scan">
              <button className="holo-button text-lg px-8 py-4">
                Launch Comprehensive Scan
                <span className="ml-2">→</span>
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-holo-cyan via-holo-green to-holo-amber animate-holo-shift" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold holo-text mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="holo-text">Advanced Protection Features</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Beyond our 4-test system, enjoy these powerful capabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Detection',
                description: 'Advanced machine learning algorithms detect scams with 95%+ accuracy',
                icon: '🤖',
              },
              {
                title: 'Comprehensive Analysis',
                description: 'Deep analysis of multiple risk factors and scam indicators',
                icon: '🔍',
              },
              {
                title: 'Family Safety',
                description: 'Protect your entire family with multi-user accounts',
                icon: '👨‍👩‍👧‍👦',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 text-center hover:scale-105 transition-transform"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 relative overflow-hidden"
          >
            {/* Animated border gradient */}
            <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-holo-cyan via-holo-green to-holo-amber animate-holo-shift">
              <div className="h-full w-full rounded-3xl bg-gray-900" />
            </div>

            <div className="relative z-10">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Don't Wait Until It's Too Late
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Scammers are getting more sophisticated every day. 
                Protect yourself and your family with AI-powered scam detection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <button className="holo-button text-lg px-8 py-4">
                    Start Free Trial
                    <span className="ml-2">→</span>
                  </button>
                </Link>
                <Link href="/scan">
                  <button className="glass-card px-8 py-4 text-lg font-semibold text-holo-cyan border border-holo-cyan hover:bg-holo-cyan/10 transition-all">
                    View Demo
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-gray-800">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Image
                src="/hero/guardian-shield.svg"
                alt="Scam Dunk"
                width={32}
                height={32}
                className="opacity-80"
              />
              <span className="font-bold text-xl holo-text">Scam Dunk</span>
            </div>
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Scam Dunk. Protecting investors worldwide.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-gray-400 hover:text-holo-cyan transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-holo-cyan transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-holo-cyan transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}