'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { useChatUpload } from '@/lib/hooks/use-chat-upload';

interface ChatUploaderProps {
  onUploadComplete?: (chatImportId: string) => void;
  onError?: (error: string) => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  chatImportId?: string;
  error?: string;
  platform?: string;
  warnings?: string[];
}

const SUPPORTED_PLATFORMS = [
  {
    platform: 'WHATSAPP',
    name: 'WhatsApp',
    formats: ['.txt', '.zip'],
    maxSize: '50MB',
    description: 'WhatsApp chat export files (with or without media)',
    icon: '💬',
  },
  {
    platform: 'TELEGRAM',
    name: 'Telegram',
    formats: ['.json'],
    maxSize: '100MB',
    description: 'Telegram chat export in JSON format',
    icon: '✈️',
  },
  {
    platform: 'DISCORD',
    name: 'Discord',
    formats: ['.json'],
    maxSize: '100MB',
    description: 'Discord chat logs (via DiscordChatExporter)',
    icon: '🎮',
    disabled: true,
  },
  {
    platform: 'INSTAGRAM',
    name: 'Instagram',
    formats: ['.png', '.jpg', '.jpeg'],
    maxSize: '50MB',
    description: 'Instagram chat screenshots (OCR processing)',
    icon: '📸',
    disabled: true,
  },
];

export default function ChatUploader({ onUploadComplete, onError }: ChatUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('AUTO');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, uploadProgress, isUploading, error: uploadError } = useChatUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/zip': ['.zip'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 5,
  });

  const handleUploadFile = async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev =>
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading', progress: 0 } 
            : f
        )
      );

      const platform = selectedPlatform === 'AUTO' ? undefined : selectedPlatform;
      
      const result = await (uploadFile.file.size > 10 * 1024 * 1024 // 10MB
        ? uploadChunkedFile(uploadFile.file, platform)
        : uploadDirectFile(uploadFile.file, platform));

      setUploadFiles(prev =>
        prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'processing', 
                progress: 100,
                chatImportId: result.chatImportId,
                warnings: result.warnings 
              } 
            : f
        )
      );

      if (onUploadComplete) {
        onUploadComplete(result.chatImportId);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadFiles(prev =>
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: errorMessage } 
            : f
        )
      );
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const uploadDirectFile = async (file: File, platform?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (platform) {
      formData.append('platform', platform);
    }

    const response = await fetch('/api/chat-import/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  };

  const uploadChunkedFile = async (file: File, platform?: string) => {
    // Initialize chunked upload
    const initResponse = await fetch('/api/chat-import/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        totalSize: file.size,
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(error.message || 'Failed to initialize upload');
    }

    const { data: initData } = await initResponse.json();
    const { uploadId, chunkSize, totalChunks } = initData;

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('chunk', chunk);

      const chunkResponse = await fetch(`/api/chat-import/upload-chunk/${uploadId}/${chunkIndex}`, {
        method: 'POST',
        body: chunkFormData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        throw new Error(error.message || 'Chunk upload failed');
      }

      // Update progress
      const progress = ((chunkIndex + 1) / totalChunks) * 90; // Reserve 10% for finalization
      setUploadFiles(prev =>
        prev.map(f => 
          f.file === file 
            ? { ...f, progress } 
            : f
        )
      );
    }

    // Finalize upload
    const finalizeResponse = await fetch('/api/chat-import/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        uploadId,
        platform,
      }),
    });

    if (!finalizeResponse.ok) {
      const error = await finalizeResponse.json();
      throw new Error(error.message || 'Failed to finalize upload');
    }

    const result = await finalizeResponse.json();
    return result.data;
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (uploadFile: UploadFile) => {
    handleUploadFile(uploadFile);
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-gray-500" />;
      case 'uploading':
        return <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'processing':
        return <RefreshCcw className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing chat...';
      case 'completed':
        return 'Analysis complete';
      case 'error':
        return 'Upload failed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Chat Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setSelectedPlatform('AUTO')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedPlatform === 'AUTO'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">Auto-detect</div>
              <div className="text-sm text-gray-500">Detect platform automatically</div>
            </button>
            
            {SUPPORTED_PLATFORMS.map((platform) => (
              <button
                key={platform.platform}
                onClick={() => !platform.disabled && setSelectedPlatform(platform.platform)}
                disabled={platform.disabled}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  platform.disabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : selectedPlatform === platform.platform
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{platform.icon}</div>
                <div className="font-semibold flex items-center gap-2">
                  {platform.name}
                  {platform.disabled && <Badge variant="secondary">Soon</Badge>}
                </div>
                <div className="text-sm text-gray-500 mb-2">{platform.description}</div>
                <div className="text-xs text-gray-400">
                  {platform.formats.join(', ')} • {platform.maxSize}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Chat Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drop chat files here or click to browse</p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports: TXT, JSON, ZIP, PNG, JPG • Max 100MB per file
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
            )}
          </div>

          {/* File Rejections */}
          {fileRejections.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <div>
                <strong>Some files were rejected:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {fileRejections.map((rejection, index) => (
                    <li key={index} className="text-sm">
                      {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upload Queue
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadFiles([])}
              >
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{uploadFile.file.name}</div>
                    <div className="text-sm text-gray-500">
                      {(uploadFile.file.size / (1024 * 1024)).toFixed(1)} MB • {getStatusText(uploadFile.status)}
                    </div>
                    
                    {uploadFile.status === 'uploading' || uploadFile.status === 'processing' ? (
                      <div className="mt-2">
                        <Progress value={uploadFile.progress} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">
                          {uploadFile.progress.toFixed(0)}%
                        </div>
                      </div>
                    ) : null}

                    {uploadFile.warnings && uploadFile.warnings.length > 0 && (
                      <div className="mt-2">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <div>
                            <strong>Warnings:</strong>
                            <ul className="mt-1 list-disc list-inside">
                              {uploadFile.warnings.map((warning, index) => (
                                <li key={index} className="text-sm">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        </Alert>
                      </div>
                    )}

                    {uploadFile.error && (
                      <div className="mt-2 text-sm text-red-600">
                        {uploadFile.error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUploadFile(uploadFile)}
                      >
                        Upload
                      </Button>
                    )}

                    {uploadFile.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(uploadFile)}
                      >
                        Retry
                      </Button>
                    )}

                    {uploadFile.status === 'completed' && uploadFile.chatImportId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/chat-import/${uploadFile.chatImportId}`, '_blank')}
                      >
                        View Results
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={uploadFile.status === 'uploading' || uploadFile.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {uploadFiles.some(f => f.status === 'pending') && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={() => {
                    uploadFiles
                      .filter(f => f.status === 'pending')
                      .forEach(handleUploadFile);
                  }}
                  disabled={isUploading}
                  className="w-full"
                >
                  Upload All Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}