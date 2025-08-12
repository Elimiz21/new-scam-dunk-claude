'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Shield,
  Eye,
  Download,
  Share2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatImportStatus } from '@/lib/hooks/use-chat-upload';

interface ChatResultsProps {
  chatImportId: string;
}

interface ChatResults {
  id: string;
  status: string;
  platform: string;
  messageCount: number;
  participantCount: number;
  overallRiskScore: number;
  riskLevel: string;
  summary: string;
  keyFindings: string[];
  dateRange: {
    from: string;
    to: string;
  };
  processingTime: number;
  messages: any[];
  participants: any[];
}

export default function ChatResults({ chatImportId }: ChatResultsProps) {
  const [results, setResults] = useState<ChatResults | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'participants' | 'analysis'>('overview');
  
  const { status, isLoading, error, fetchStatus, fetchResults } = useChatImportStatus(chatImportId);

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      if (status?.status !== 'COMPLETED' && status?.status !== 'FAILED') {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchStatus, status?.status]);

  useEffect(() => {
    if (status?.status === 'COMPLETED') {
      fetchResults().then(setResults).catch(console.error);
    }
  }, [status?.status, fetchResults]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span>Loading chat analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <div>
          <strong>Error loading results:</strong>
          <p>{error}</p>
        </div>
      </Alert>
    );
  }

  if (!status) {
    return null;
  }

  // Show processing status
  if (status.status !== 'COMPLETED') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Processing Chat Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Status: {status.status}</span>
                <Badge variant={status.status === 'FAILED' ? 'destructive' : 'default'}>
                  {status.status}
                </Badge>
              </div>
              {status.status === 'PROCESSING' && (
                <Progress value={75} className="h-2" />
              )}
            </div>
          </div>
          
          {status.error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <div>
                <strong>Processing Error:</strong>
                <p>{status.error}</p>
              </div>
            </Alert>
          )}
          
          <div className="text-sm text-gray-600">
            Processing time: {Math.floor((status.processingTime || 0) / 1000)}s
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return null;
  }

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (fromStr: string, toStr: string) => {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getPlatformIcon(results.platform)}</span>
              Chat Analysis Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{results.messageCount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Messages</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{results.participantCount}</div>
                <div className="text-sm text-gray-500">Participants</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(results.dateRange.from, results.dateRange.to)}
                </div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {results.overallRiskScore}
                  <Badge className={getRiskLevelColor(results.riskLevel)}>
                    {results.riskLevel}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">Risk Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'messages', label: 'Messages', icon: MessageCircle },
              { key: 'participants', label: 'Participants', icon: Users },
              { key: 'analysis', label: 'Analysis', icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-gray-700">{results.summary}</p>
              </div>

              {/* Key Findings */}
              {results.keyFindings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
                  <div className="space-y-2">
                    {results.keyFindings.map((finding, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <p>{finding}</p>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">From</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(results.dateRange.from)}
                      </div>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-blue-200 rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full w-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">To</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(results.dateRange.to)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Recent Messages</h3>
                <Badge variant="secondary">
                  Showing {Math.min(results.messages.length, 100)} of {results.messageCount}
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.messages.slice(0, 100).map((message, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{message.senderName}</span>
                      <div className="flex items-center gap-2">
                        {message.riskScore > 50 && (
                          <Badge variant="destructive" className="text-xs">
                            High Risk
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                    {message.riskFlags && message.riskFlags.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {message.riskFlags.slice(0, 3).map((flag: string, flagIndex: number) => (
                            <Badge key={flagIndex} variant="outline" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Participants</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.participants.map((participant, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{participant.name}</h4>
                          {participant.username && (
                            <p className="text-sm text-gray-500">@{participant.username}</p>
                          )}
                        </div>
                        {participant.riskScore > 50 && (
                          <Badge variant="destructive">
                            High Risk
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Messages:</span>
                          <span className="font-medium">{participant.messageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className={`font-medium ${participant.riskScore > 50 ? 'text-red-600' : 'text-green-600'}`}>
                            {participant.riskScore}/100
                          </span>
                        </div>
                        {participant.firstMessage && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">First Message:</span>
                            <span className="font-medium">
                              {formatDate(participant.firstMessage)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {participant.riskFlags && participant.riskFlags.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex flex-wrap gap-1">
                            {participant.riskFlags.slice(0, 3).map((flag: string, flagIndex: number) => (
                              <Badge key={flagIndex} variant="outline" className="text-xs">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Risk Assessment</h3>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Overall Risk Score</span>
                      <Badge className={getRiskLevelColor(results.riskLevel)}>
                        {results.riskLevel}
                      </Badge>
                    </div>
                    <Progress value={results.overallRiskScore} className="h-3 mb-2" />
                    <div className="text-center text-2xl font-bold">
                      {results.overallRiskScore}/100
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Processing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="font-semibold">
                        {(results.processingTime / 1000).toFixed(1)}s
                      </div>
                      <div className="text-sm text-gray-500">Processing Time</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-semibold">{results.platform}</div>
                      <div className="text-sm text-gray-500">Platform</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-purple-500" />
                    <div>
                      <div className="font-semibold">Complete</div>
                      <div className="text-sm text-gray-500">Analysis Status</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}