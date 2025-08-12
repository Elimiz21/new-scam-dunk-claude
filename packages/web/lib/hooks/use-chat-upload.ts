'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';

interface UploadOptions {
  platform?: string;
  language?: string;
  timezone?: string;
}

interface UploadResult {
  chatImportId: string;
  status: string;
  message: string;
  warnings?: string[];
}

interface UploadProgress {
  progress: number;
  isComplete: boolean;
}

export function useChatUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const uploadFile = useCallback(async (
    file: File, 
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      // Determine upload method based on file size
      if (file.size > 10 * 1024 * 1024) { // 10MB threshold
        return await uploadChunkedFile(file, options);
      } else {
        return await uploadDirectFile(file, options);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [token]);

  const uploadDirectFile = async (file: File, options: UploadOptions): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.platform) {
      formData.append('platform', options.platform);
    }

    const response = await fetch('/api/chat-import/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result.data;
  };

  const uploadChunkedFile = async (file: File, options: UploadOptions): Promise<UploadResult> => {
    // Step 1: Initialize chunked upload
    const initResponse = await fetch('/api/chat-import/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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

    const initResult = await initResponse.json();
    if (!initResult.success) {
      throw new Error(initResult.message || 'Failed to initialize upload');
    }

    const { uploadId, chunkSize, totalChunks } = initResult.data;

    // Step 2: Upload chunks
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
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json();
        throw new Error(error.message || 'Chunk upload failed');
      }

      const chunkResult = await chunkResponse.json();
      if (!chunkResult.success) {
        throw new Error(chunkResult.message || 'Chunk upload failed');
      }

      // Update progress
      const progress = ((chunkIndex + 1) / totalChunks) * 90; // Reserve 10% for finalization
      setUploadProgress({
        progress,
        isComplete: chunkResult.data.isComplete,
      });
    }

    // Step 3: Finalize upload
    setUploadProgress({ progress: 95, isComplete: false });

    const finalizeResponse = await fetch('/api/chat-import/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        uploadId,
        platform: options.platform,
        language: options.language,
        timezone: options.timezone,
      }),
    });

    if (!finalizeResponse.ok) {
      const error = await finalizeResponse.json();
      throw new Error(error.message || 'Failed to finalize upload');
    }

    const finalizeResult = await finalizeResponse.json();
    if (!finalizeResult.success) {
      throw new Error(finalizeResult.message || 'Failed to finalize upload');
    }

    setUploadProgress({ progress: 100, isComplete: true });

    return finalizeResult.data;
  };

  const cancelUpload = useCallback(async (uploadId: string): Promise<void> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/chat-import/upload/${uploadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel upload');
    }

    setUploadProgress(null);
    setError(null);
  }, [token]);

  const getUploadProgress = useCallback(async (uploadId: string): Promise<UploadProgress> => {
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/chat-import/upload/${uploadId}/progress`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get upload progress');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get upload progress');
    }

    return result.data;
  }, [token]);

  const resetState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(null);
    setError(null);
  }, []);

  return {
    uploadFile,
    cancelUpload,
    getUploadProgress,
    isUploading,
    uploadProgress,
    error,
    resetState,
  };
}

export function useChatImportStatus(chatImportId?: string) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchStatus = useCallback(async () => {
    if (!chatImportId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat-import/status/${chatImportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch status');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch status');
      }

      setStatus(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [chatImportId, token]);

  const fetchResults = useCallback(async () => {
    if (!chatImportId || !token) return null;

    const response = await fetch(`/api/chat-import/results/${chatImportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch results');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch results');
    }

    return result.data;
  }, [chatImportId, token]);

  return {
    status,
    isLoading,
    error,
    fetchStatus,
    fetchResults,
  };
}