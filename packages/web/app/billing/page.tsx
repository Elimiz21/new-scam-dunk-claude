'use client';

import { motion } from 'framer-motion';
import { CreditCard, Check, AlertCircle, Download, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function BillingPage() {
  const { user } = useAuthStore();
  
  // Mock data - in production this would come from your API
  const currentPlan = {
    name: 'Pro',
    price: 19,
    period: 'month',
    nextBilling: '2024-02-15',
    status: 'active'
  };

  const usage = {
    scansUsed: 142,
    scansLimit: 'Unlimited',
    familyMembers: 2,
    familyLimit: 3,
    apiCalls: 1240,
    apiLimit: 10000
  };

  const invoices = [
    { id: 1, date: '2024-01-15', amount: 19.00, status: 'paid' },
    { id: 2, date: '2023-12-15', amount: 19.00, status: 'paid' },
    { id: 3, date: '2023-11-15', amount: 19.00, status: 'paid' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-holo-purple/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="holo-text">Billing & Plan</span>
          </h1>
          <p className="text-gray-400">Manage your subscription and billing details</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Plan Details */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Current Plan</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-holo-cyan">{currentPlan.name}</span>
                    <span className="text-gray-400">
                      ${currentPlan.price}/{currentPlan.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Next billing date: {currentPlan.nextBilling}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-holo-green/20 text-holo-green text-sm font-medium">
                  Active
                </span>
              </div>

              <div className="flex gap-4">
                <Link href="/pricing" className="holo-button px-6 py-2">
                  Upgrade Plan
                </Link>
                <button className="glass-button px-6 py-2 text-gray-300">
                  Cancel Subscription
                </button>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Scans</span>
                    <span className="text-white">{usage.scansUsed} / {usage.scansLimit}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-holo-cyan to-holo-cyan-light" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Family Members</span>
                    <span className="text-white">{usage.familyMembers} / {usage.familyLimit}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-holo-green to-holo-green-light" style={{ width: '66%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">API Calls</span>
                    <span className="text-white">{usage.apiCalls.toLocaleString()} / {usage.apiLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-holo-purple to-purple-400" style={{ width: '12%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Billing History</h3>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-white">{invoice.date}</p>
                        <p className="text-xs text-gray-400">Invoice #{invoice.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white">${invoice.amount.toFixed(2)}</span>
                      <span className="px-2 py-1 rounded-full bg-holo-green/20 text-holo-green text-xs">
                        {invoice.status}
                      </span>
                      <button className="text-gray-400 hover:text-holo-cyan transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Payment Method */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Payment Method</h3>
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-holo-cyan" />
                  <span className="text-white">•••• •••• •••• 4242</span>
                </div>
                <p className="text-xs text-gray-400">Expires 12/25</p>
              </div>
              <button className="glass-button w-full mt-4 py-2">
                Update Payment Method
              </button>
            </div>

            {/* Plan Features */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Your Plan Includes</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-holo-green flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">Unlimited scans</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-holo-green flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">Advanced AI detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-holo-green flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">Real-time monitoring</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-holo-green flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">Family sharing (3 users)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-holo-green flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">API access</span>
                </li>
              </ul>
            </div>

            {/* Need Help */}
            <div className="glass-card p-6 border border-holo-cyan/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-holo-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Need Help?</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Have questions about billing or your plan?
                  </p>
                  <Link href="/support" className="text-sm text-holo-cyan hover:text-holo-cyan-light transition-colors">
                    Contact Support →
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}