'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Users, Activity, TrendingUp, AlertCircle,
  BarChart3, PieChart, Calendar, Clock, LogOut,
  Settings, Key, Database, Zap
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Scam Dunk Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/settings"
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Activity />}
            title="Total Scans"
            value={stats?.totalScans || 0}
            change={`+${stats?.scansToday || 0} today`}
            color="purple"
          />
          <StatCard
            icon={<Users />}
            title="Total Users"
            value={stats?.totalUsers || 0}
            change={`${stats?.activeUsers || 0} active`}
            color="cyan"
          />
          <StatCard
            icon={<TrendingUp />}
            title="This Week"
            value={stats?.scansThisWeek || 0}
            change="scans performed"
            color="green"
          />
          <StatCard
            icon={<AlertCircle />}
            title="High Risk"
            value={stats?.riskDistribution?.high + stats?.riskDistribution?.critical || 0}
            change="threats detected"
            color="red"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* API Usage */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-purple-400" />
              API Usage Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.apiUsage || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-800 rounded-full mr-3">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                        style={{ width: `${(value / stats.totalScans) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-mono">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
              Risk Level Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.riskDistribution || {}).map(([level, count]: [string, any]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className={`capitalize font-medium ${
                    level === 'critical' ? 'text-red-400' :
                    level === 'high' ? 'text-orange-400' :
                    level === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {level}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-800 rounded-full mr-3">
                      <div
                        className={`h-full rounded-full ${
                          level === 'critical' ? 'bg-red-500' :
                          level === 'high' ? 'bg-orange-500' :
                          level === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(count / stats.totalScans) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            Recent Scans
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Risk Score</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {stats?.recentScans?.map((scan: any) => (
                  <tr key={scan.id} className="border-t border-gray-800">
                    <td className="py-3 font-mono text-sm">{scan.id}</td>
                    <td className="py-3 capitalize">{scan.scan_type}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        scan.risk_score > 75 ? 'bg-red-500/20 text-red-400' :
                        scan.risk_score > 50 ? 'bg-orange-500/20 text-orange-400' :
                        scan.risk_score > 25 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {scan.risk_score}%
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-sm">
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/settings" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all">
              <Key className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">API Keys</h3>
              <p className="text-gray-400 text-sm">Manage external service integrations</p>
            </div>
          </Link>
          
          <Link href="/admin/database" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all">
              <Database className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Database</h3>
              <p className="text-gray-400 text-sm">View and manage stored data</p>
            </div>
          </Link>
          
          <Link href="/admin/performance" className="group">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all">
              <Zap className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-white font-semibold mb-1">Performance</h3>
              <p className="text-gray-400 text-sm">Monitor system performance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  change: string;
  color: 'purple' | 'cyan' | 'green' | 'red';
}

function StatCard({ icon, title, value, change, color }: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 bg-gradient-to-br ${colorClasses[color]} rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{change}</div>
    </motion.div>
  );
}