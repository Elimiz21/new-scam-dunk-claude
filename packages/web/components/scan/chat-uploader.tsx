'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useScanStore } from '@/lib/stores/scan-store'
import { formatBytes } from '@/lib/utils'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X,
  ScanLine,
  CheckCircle,
  FileImage,
  FileType
} from 'lucide-react'

interface ChatUploaderProps {
  onScanStart: (scanId: string) => void
}

const acceptedFileTypes = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
}

const maxFileSize = 10 * 1024 * 1024 // 10MB

export function ChatUploader({ onScanStart }: ChatUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const { startScan, loading } = useScanStore()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('')

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > maxFileSize) {
          return `${file.file.name} is too large (max ${formatBytes(maxFileSize)})`
        }
        return `${file.file.name} is not a supported file type`
      })
      setError(errors.join(', '))
      return
    }

    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleScan = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file to scan')
      return
    }

    try {
      setError('')
      // For now, we'll just use the first file
      const scanId = await startScan(uploadedFiles[0])
      onScanStart(scanId)
    } catch (err: any) {
      setError(err.message || 'Failed to start scan')
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    }
    if (file.type === 'application/pdf') {
      return <FileType className="h-5 w-5 text-red-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return 'Image'
    if (file.type === 'application/pdf') return 'PDF'
    if (file.type === 'text/plain') return 'Text'
    return 'File'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-colors
                  ${isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  <Upload className="h-8 w-8" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop files here' : 'Upload chat files'}
                </h3>
                <p className="text-muted-foreground">
                  Drag & drop your chat screenshots, text exports, or PDFs here, or click to browse
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Screenshots</Badge>
                <Badge variant="secondary">Text Files</Badge>
                <Badge variant="secondary">PDF Documents</Badge>
                <Badge variant="secondary">Chat Exports</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Max file size: {formatBytes(maxFileSize)} • Supported: PNG, JPG, PDF, TXT, CSV
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-success mr-2" />
              Ready to Scan ({uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''})
            </h4>
            
            <div className="space-y-3 mb-6">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(file)}
                        </Badge>
                        <span>{formatBytes(file.size)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            <Button 
              onClick={handleScan} 
              className="w-full" 
              size="lg"
              loading={loading}
              disabled={uploadedFiles.length === 0}
            >
              <ScanLine className="mr-2 h-5 w-5" />
              Start Security Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Examples */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">What can you scan?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">Chat Screenshots</div>
                  <div className="text-xs text-muted-foreground">
                    WhatsApp, Telegram, iMessage, etc.
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">Text Exports</div>
                  <div className="text-xs text-muted-foreground">
                    Chat backups, email threads
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <FileType className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">PDF Documents</div>
                  <div className="text-xs text-muted-foreground">
                    Email PDFs, document scans
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium text-sm">Chat Platform</div>
                  <div className="text-xs text-muted-foreground">
                    Facebook, Instagram messages
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
