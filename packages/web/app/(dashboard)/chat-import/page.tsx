'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Trash2,
  Calendar,
  Users,
  MessageCircle 
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp': return '💬';
      case 'telegram': return '✈️';
      case 'discord': return '🎮';
      case 'instagram': return '📸';
      default: return '💬';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level?: string) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Import Chat</h1>
            <p className="text-gray-600">Upload and analyze chat exports for scam detection</p>
          </div>
          <Button variant="outline" onClick={() => setShowUploader(false)}>
            Back to List
          </Button>
        </div>
        
        <ChatUploader 
          onUploadComplete={handleUploadComplete}
          onError={(error) => console.error('Upload error:', error)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Import</h1>
          <p className="text-gray-600">Upload and analyze chat exports for scam detection</p>
        </div>
        <Button onClick={() => setShowUploader(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import Chat
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by filename or platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="uploading">Uploading</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Imports List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredImports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No chat imports found</h3>
            <p className="text-gray-600 mb-4">
              {chatImports.length === 0 
                ? "Get started by importing your first chat export"
                : "No imports match your current filters"
              }
            </p>
            {chatImports.length === 0 && (
              <Button onClick={() => setShowUploader(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Your First Chat
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredImports.map((chatImport) => (
            <Card key={chatImport.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPlatformIcon(chatImport.platform)}</span>
                      <div>
                        <h3 className="font-semibold truncate">{chatImport.originalFileName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{chatImport.platform}</span>
                          <span>{formatFileSize(chatImport.fileSize)}</span>
                          <span>{formatDate(chatImport.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Badge className={getStatusColor(chatImport.status)}>
                        {chatImport.status}
                      </Badge>
                      
                      {chatImport.riskLevel && (
                        <Badge className={getRiskColor(chatImport.riskLevel)}>
                          Risk: {chatImport.riskLevel}
                        </Badge>
                      )}
                      
                      {chatImport.processingTime && (
                        <span className="text-sm text-gray-500">
                          Processed in {(chatImport.processingTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    
                    {chatImport.status === 'COMPLETED' && (
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4 text-blue-500" />
                          <span>{chatImport.messageCount.toLocaleString()} messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>{chatImport.participantCount} participants</span>
                        </div>
                        {chatImport.overallRiskScore !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500 font-medium">
                              {chatImport.overallRiskScore}/100 risk score
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {chatImport.summary && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {chatImport.summary}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {chatImport.status === 'COMPLETED' && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/chat-import/${chatImport.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Results
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteImport(chatImport.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}