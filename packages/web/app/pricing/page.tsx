'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Shield, Users, Star } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Basic protection for individuals',
    features: [
      '5 scans per month',
      'Basic AI detection',
      'Email support',
      'Browser extension',
    ],
    color: 'from-gray-600 to-gray-400',
    buttonText: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Advanced protection for active users',
    features: [
      'Unlimited scans',
      'Advanced AI detection',
      'Priority support',
      'Real-time monitoring',
      'Family sharing (3 users)',
      'API access',
    ],
    color: 'from-holo-cyan to-holo-cyan-light',
    buttonText: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Family',
    price: '$39',
    period: '/month',
    description: 'Complete protection for your whole family',
    features: [
      'Everything in Pro',
      'Up to 10 family members',
      'Elder-specific features',
      'Activity dashboard',
      'Emergency alerts',
      'Phone support',
      'Custom training',
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
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

        {/* Enterprise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-holo-cyan" />
              <h3 className="text-2xl font-bold text-white">Enterprise Solutions</h3>
              <Users className="w-8 h-8 text-holo-cyan" />
            </div>
            <p className="text-gray-400 mb-6">
              Protect your entire organization with custom AI models, dedicated support, and enterprise-grade security
            </p>
            <Link href="/contact">
              <button className="holo-button px-8 py-3">
                Contact Sales
                <Zap className="w-4 h-4 ml-2 inline" />
              </button>
            </Link>
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
              <h4 className="font-semibold text-white mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">Is there a free trial?</h4>
              <p className="text-gray-400">Yes! All paid plans come with a 14-day free trial. No credit card required to start.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">How does family sharing work?</h4>
              <p className="text-gray-400">You can invite family members to your account. Each member gets their own login and personalized protection settings.</p>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold text-white mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-400">We accept all major credit cards, PayPal, and for enterprise customers, we offer invoicing options.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}