'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone, FileText, Book, HelpCircle, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-holo-green/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="holo-text">How Can We Help?</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get the support you need to stay protected from scams and fraud
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 text-center hover:border-holo-cyan/50 transition-all"
          >
            <div className="relative inline-block mb-4">
              <MessageSquare className="w-12 h-12 text-holo-cyan" />
              <div className="absolute inset-0 rounded-full bg-holo-cyan/20 blur-xl animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
            <p className="text-gray-400 mb-4">Chat with our support team in real-time</p>
            <p className="text-sm text-holo-cyan mb-4">Available 24/7</p>
            <button className="holo-button px-6 py-2 w-full">Start Chat</button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 text-center hover:border-holo-green/50 transition-all"
          >
            <div className="relative inline-block mb-4">
              <Mail className="w-12 h-12 text-holo-green" />
              <div className="absolute inset-0 rounded-full bg-holo-green/20 blur-xl animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-gray-400 mb-4">Get detailed help via email</p>
            <p className="text-sm text-holo-green mb-4">Response within 24h</p>
            <a href="mailto:support@scamdunk.com" className="glass-button px-6 py-2 w-full inline-block">
              Send Email
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 text-center hover:border-holo-amber/50 transition-all"
          >
            <div className="relative inline-block mb-4">
              <Phone className="w-12 h-12 text-holo-amber" />
              <div className="absolute inset-0 rounded-full bg-holo-amber/20 blur-xl animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Phone Support</h3>
            <p className="text-gray-400 mb-4">Speak directly with our team</p>
            <p className="text-sm text-holo-amber mb-4">Pro & Family plans only</p>
            <button className="glass-button px-6 py-2 w-full">1-800-SCAM-DUNK</button>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Book className="w-6 h-6 text-holo-cyan" />
              <h3 className="text-xl font-bold text-white">Documentation</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Learn how to use all features of Scam Dunk with our comprehensive guides
            </p>
            <div className="space-y-3">
              <Link href="/docs/getting-started" className="block text-gray-400 hover:text-holo-cyan transition-colors">
                → Getting Started Guide
              </Link>
              <Link href="/docs/api" className="block text-gray-400 hover:text-holo-cyan transition-colors">
                → API Documentation
              </Link>
              <Link href="/docs/integrations" className="block text-gray-400 hover:text-holo-cyan transition-colors">
                → Browser Extensions & Integrations
              </Link>
              <Link href="/docs/family" className="block text-gray-400 hover:text-holo-cyan transition-colors">
                → Family Protection Setup
              </Link>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-6 h-6 text-holo-green" />
              <h3 className="text-xl font-bold text-white">FAQ</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Find answers to the most common questions about our service
            </p>
            <div className="space-y-3">
              <Link href="/faq#detection" className="block text-gray-400 hover:text-holo-green transition-colors">
                → How does AI detection work?
              </Link>
              <Link href="/faq#privacy" className="block text-gray-400 hover:text-holo-green transition-colors">
                → Is my data private and secure?
              </Link>
              <Link href="/faq#accuracy" className="block text-gray-400 hover:text-holo-green transition-colors">
                → What is the detection accuracy?
              </Link>
              <Link href="/faq#refund" className="block text-gray-400 hover:text-holo-green transition-colors">
                → What is your refund policy?
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Emergency Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 border-2 border-holo-red/30"
        >
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-holo-red flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Emergency: I Think I\'m Being Scammed</h3>
              <p className="text-gray-400 mb-4">
                If you believe you are currently being targeted by a scammer or have already fallen victim to a scam:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-holo-red mb-2">1. Stop All Communication</h4>
                  <p className="text-sm text-gray-400">Immediately cease all contact with the suspected scammer</p>
                </div>
                <div>
                  <h4 className="font-semibold text-holo-amber mb-2">2. Secure Your Accounts</h4>
                  <p className="text-sm text-gray-400">Change passwords and enable 2FA on all financial accounts</p>
                </div>
                <div>
                  <h4 className="font-semibold text-holo-cyan mb-2">3. Report & Get Help</h4>
                  <p className="text-sm text-gray-400">Contact your bank and file reports with IC3.gov and FTC.gov</p>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button className="holo-button px-6 py-2">
                  <Phone className="w-4 h-4 mr-2 inline" />
                  Emergency Hotline
                </button>
                <Link href="/emergency-guide" className="glass-button px-6 py-2">
                  View Full Emergency Guide
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Office Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <Clock className="w-8 h-8 text-holo-cyan mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">Support Hours</h3>
            <div className="space-y-2 text-gray-400">
              <p><span className="text-white">Live Chat:</span> 24/7 Available</p>
              <p><span className="text-white">Email:</span> Response within 24 hours</p>
              <p><span className="text-white">Phone (Pro/Family):</span> Mon-Fri 9AM-9PM EST, Sat-Sun 10AM-6PM EST</p>
              <p><span className="text-white">Emergency Hotline:</span> 24/7 for active scam situations</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}