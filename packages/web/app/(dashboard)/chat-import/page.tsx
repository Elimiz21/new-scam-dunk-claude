'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Trash2,
  Calendar,
  Users,
  MessageCircle,
  Shield,
  AlertTriangle,
  FileText,
  Zap,
  ChevronRight,
  Clock
} from 'lucide-react';
import ChatUploader from '@/components/chat-import/chat-uploader';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';

interface ChatImport {
  id: string;
  platform: string;
  status: string;
  originalFileName: string;
  fileSize: number;
  messageCount: number;
  participantCount: number;
  overallRiskScore?: number;
  riskLevel?: string;
  summary?: string;
  createdAt: string;
  processingTime?: number;
}

export default function ChatImportPage() {
  const [chatImports, setChatImports] = useState<ChatImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUploader, setShowUploader] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchChatImports();
  }, []);

  const fetchChatImports = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chat-import/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setChatImports(result.data.chatImports || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat imports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (chatImportId: string) => {
    // Refresh the list and navigate to results
    fetchChatImports();
    router.push(`/chat-import/${chatImportId}`);
  };

  const handleDeleteImport = async (chatImportId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/chat-import/${chatImportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setChatImports(prev => prev.filter(imp => imp.id !== chatImportId));
      }
    } catch (error) {
      console.error('Failed to delete chat import:', error);
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return 'from-green-500 to-green-600';
      case 'telegram': return 'from-blue-500 to-blue-600';
      case 'discord': return 'from-purple-500 to-purple-600';
      case 'instagram': return 'from-pink-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-holo-green bg-holo-green/20 border-holo-green/50';
      case 'processing': return 'text-holo-cyan bg-holo-cyan/20 border-holo-cyan/50 animate-pulse';
      case 'failed': return 'text-holo-red bg-holo-red/20 border-holo-red/50';
      case 'uploading': return 'text-holo-amber bg-holo-amber/20 border-holo-amber/50';
      default: return 'text-gray-400 bg-gray-800/50 border-gray-700';
    }
  };

  const getRiskGradient = (level?: string) => {
    if (!level) return 'from-gray-600 to-gray-700';
    
    switch (level.toLowerCase()) {
      case 'low': return 'from-holo-green to-holo-green-light';
      case 'medium': return 'from-holo-amber to-holo-amber-light';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'critical': return 'from-holo-red to-red-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredImports = chatImports.filter(imp => {
    const matchesSearch = imp.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         imp.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || imp.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (showUploader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold">
                <span className="holo-text">Import Chat</span>
              </h1>
              <p className="text-gray-400 mt-2">Upload and analyze chat exports for scam detection</p>
            </div>
            <button 
              onClick={() => setShowUploader(false)}
              className="glass-card px-6 py-2 text-gray-300 border border-gray-700 hover:border-holo-cyan/50 hover:text-white transition-all"
            >
              Back to List
            </button>
          </motion.div>
          
          <ChatUploader 
            onUploadComplete={handleUploadComplete}
            onError={(error) => console.error('Upload error:', error)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-holo-dark via-gray-900 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-holo-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-holo-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <MessageCircle className="mr-3 h-8 w-8 text-holo-cyan" />
              <span className="holo-text">Chat Import</span>
            </h1>
            <p className="text-gray-400 mt-2">Upload and analyze chat exports for scam detection</p>
          </div>
          <button 
            onClick={() => setShowUploader(true)}
            className="holo-button flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Chat
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by filename or platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-holo-cyan" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="glass-input px-4 py-2"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="uploading">Uploading</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Chat Imports List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="holo-spinner w-12 h-12" />
          </div>
        ) : filteredImports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center"
          >
            <MessageCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">No chat imports found</h3>
            <p className="text-gray-400 mb-6">
              {chatImports.length === 0 
                ? "Get started by importing your first chat export"
                : "No imports match your current filters"
              }
            </p>
            {chatImports.length === 0 && (
              <button 
                onClick={() => setShowUploader(true)}
                className="holo-button mx-auto flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Your First Chat
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredImports.map((chatImport, index) => (
              <motion.div
                key={chatImport.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="glass-card p-6 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      {/* Platform Icon with Gradient */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlatformColor(chatImport.platform)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {chatImport.platform[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white truncate text-lg">{chatImport.originalFileName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {chatImport.platform}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {formatFileSize(chatImport.fileSize)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(chatImport.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(chatImport.status)}`}>
                        {chatImport.status}
                      </span>
                      
                      {chatImport.riskLevel && (
                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getRiskGradient(chatImport.riskLevel)} text-white text-xs font-medium shadow-lg`}>
                          Risk: {chatImport.riskLevel}
                        </div>
                      )}
                      
                      {chatImport.processingTime && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Processed in {(chatImport.processingTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    
                    {chatImport.status === 'COMPLETED' && (
                      <div className="flex items-center gap-6 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-holo-cyan/20">
                            <MessageCircle className="h-4 w-4 text-holo-cyan" />
                          </div>
                          <span className="text-gray-300">{chatImport.messageCount.toLocaleString()} messages</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-holo-green/20">
                            <Users className="h-4 w-4 text-holo-green" />
                          </div>
                          <span className="text-gray-300">{chatImport.participantCount} participants</span>
                        </div>
                        {chatImport.overallRiskScore !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-holo-amber/20">
                              <AlertTriangle className="h-4 w-4 text-holo-amber" />
                            </div>
                            <span className="text-holo-amber font-medium">
                              {chatImport.overallRiskScore}/100 risk score
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {chatImport.summary && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {chatImport.summary}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {chatImport.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/chat-import/${chatImport.id}`)}
                        className="holo-button px-4 py-2 text-sm flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Results
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteImport(chatImport.id)}
                      className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-500 hover:text-holo-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Holographic Line Effect on Hover */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-holo-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}