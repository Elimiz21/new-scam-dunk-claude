'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Shield, Users, Star } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '1 free test',
    description: 'Try our protection once for free',
    features: [
      '1 comprehensive scan',
      'All 4 detection tests',
      'Full AI analysis',
      'Detailed report',
      'No credit card required',
    ],
    color: 'from-gray-600 to-gray-400',
    buttonText: 'Start Free Test',
    popular: false,
    isFreeTrial: true,
  },
  {
    name: 'Pay Per Scan',
    price: '$4.99',
    period: 'per scan',
    description: 'Perfect for occasional checks',
    features: [
      'Single comprehensive scan',
      'All 4 detection tests',
      'Advanced AI detection',
      'Downloadable report',
      'Email results',
      '30-day result storage',
    ],
    color: 'from-green-600 to-green-400',
    buttonText: 'Buy Single Scan',
    popular: false,
    isOneTime: true,
  },
  {
    name: 'Personal',
    price: '$9.99',
    period: '/month',
    description: 'Unlimited protection for one user',
    features: [
      'Unlimited scans',
      'All 4 detection tests',
      'Real-time monitoring',
      'Priority support',
      'Scan history',
      'Mobile app access',
      'Email & SMS alerts',
    ],
    color: 'from-holo-cyan to-holo-cyan-light',
    buttonText: 'Start Monthly Plan',
    popular: true,
  },
  {
    name: 'Family',
    price: '$19.99',
    period: '/month',
    description: 'Protection for up to 3 family members',
    features: [
      'Everything in Personal',
      'Up to 3 users',
      'Family dashboard',
      'Elder-specific features',
      'Activity monitoring',
      'Emergency alerts',
      'Phone support',
      'Parental controls',
    ],
    color: 'from-holo-purple to-purple-400',
    buttonText: 'Protect Your Family',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-holo-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="holo-text">Choose Your Protection Plan</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced AI-powered scam detection that keeps you and your loved ones safe from online threats
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <span className="bg-gradient-to-r from-holo-cyan to-holo-cyan-light text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`glass-card p-8 h-full ${plan.popular ? 'border-2 border-holo-cyan/50' : ''}`}>
                {/* Plan Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-4xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-gray-400">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-holo-cyan flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href="/register">
                  <button className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                    plan.popular 
                      ? 'holo-button text-white' 
                      : 'glass-button text-gray-300 hover:text-white'
                  }`}>
                    {plan.buttonText}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Teams & Enterprise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Teams Plan */}
              <div className="text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-holo-cyan" />
                  <h3 className="text-xl font-bold text-white">Teams Plan</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-holo-cyan">$49.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400 mb-4">
                  Perfect for investment managers, advisors, family offices, and consultants
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-holo-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Unlimited users & scans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-holo-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Team management dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-holo-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">API access & integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-holo-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Compliance reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-holo-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Dedicated account manager</span>
                  </li>
                </ul>
                <Link href="/register">
                  <button className="holo-button px-6 py-2 text-sm">
                    Start Team Trial
                  </button>
                </Link>
              </div>

              {/* Enterprise */}
              <div className="text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Enterprise</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-purple-400">Custom</span>
                  <span className="text-gray-400"> pricing</span>
                </div>
                <p className="text-gray-400 mb-4">
                  For large organizations with specific security and compliance needs
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Custom AI model training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">On-premise deployment option</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">SLA & 24/7 support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">SOC 2 compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">White-label options</span>
                  </li>
                </ul>
                <Link href="/contact">
                  <button className="glass-button px-6 py-2 text-sm hover:border-purple-400">
                    Contact Sales
                    <Zap className="w-4 h-4 ml-2 inline" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="holo-text">Frequently Asked Questions</span>
          </h2>
          
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">How does the free test work?</h4>
              <p className="text-gray-400">Every new user gets one free comprehensive scan that includes all 4 detection tests. No credit card required. After your free test, you can choose to buy individual scans or subscribe to a monthly plan.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">What's the difference between pay-per-scan and monthly plans?</h4>
              <p className="text-gray-400">Pay-per-scan ($4.99) is perfect for occasional checks. Monthly plans offer unlimited scans, real-time monitoring, and additional features like alerts and scan history. If you scan more than twice a month, a subscription saves you money.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">Can I share my Family plan with friends?</h4>
              <p className="text-gray-400">The Family plan ($19.99/month) is designed for up to 3 family members living in the same household. Each member gets their own login and personalized protection settings.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">What's included in the Teams plan?</h4>
              <p className="text-gray-400">The Teams plan ($49.99/month) includes unlimited users and scans, making it perfect for investment managers, financial advisors, family offices, and consulting firms. It includes team management tools, compliance reporting, and API access.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">Can I cancel my subscription anytime?</h4>
              <p className="text-gray-400">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period. No cancellation fees or long-term contracts.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-400">We accept all major credit cards, debit cards, PayPal, and for Teams/Enterprise customers, we offer ACH transfers and invoicing options.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}