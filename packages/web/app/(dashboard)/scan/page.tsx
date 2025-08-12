'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatUploader } from '@/components/scan/chat-uploader'
import { ScanResults } from '@/components/scan/scan-results'
import { ScanProgress } from '@/components/scan/scan-progress'
import { useScanStore } from '@/lib/stores/scan-store'
import { 
  ScanLine, 
  FileText, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

export default function ScanPage() {
  const [scanStep, setScanStep] = useState<'upload' | 'processing' | 'results'>('upload')
  const { currentScan, loading, uploadProgress } = useScanStore()

  const handleScanStart = (scanId: string) => {
    setScanStep('processing')
  }

  const handleScanComplete = () => {
    setScanStep('results')
  }

  const handleNewScan = () => {
    setScanStep('upload')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ScanLine className="mr-3 h-6 w-6" />
              New Scam Scan
            </h1>
            <p className="text-muted-foreground">
              Upload chat screenshots or text files to detect potential scams and fraud
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div 
        variants={fadeInUp} 
        initial="initial" 
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="font-medium text-sm">AI-Powered</div>
                <div className="text-xs text-muted-foreground">
                  Advanced threat detection
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-info/10 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <div className="font-medium text-sm">Multiple Formats</div>
                <div className="text-xs text-muted-foreground">
                  Screenshots, text, PDFs
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-warning/10 rounded-lg mr-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <div className="font-medium text-sm">Instant Results</div>
                <div className="text-xs text-muted-foreground">
                  Analysis in seconds
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        variants={fadeInUp} 
        initial="initial" 
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        {scanStep === 'upload' && (
          <ChatUploader onScanStart={handleScanStart} />
        )}

        {scanStep === 'processing' && (
          <ScanProgress 
            progress={uploadProgress} 
            onComplete={handleScanComplete}
          />
        )}

        {scanStep === 'results' && currentScan && (
          <ScanResults 
            scan={currentScan} 
            onNewScan={handleNewScan}
          />
        )}
      </motion.div>

      {/* Security Notice */}
      <motion.div 
        variants={fadeInUp} 
        initial="initial" 
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <Card className="border-info/20 bg-info/5">
          <CardContent className="flex items-start p-4">
            <Info className="h-5 w-5 text-info mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-info mb-1">
                Privacy & Security
              </div>
              <div className="text-muted-foreground">
                Your uploaded files are encrypted and processed securely. We never store your personal conversations. 
                All scans are automatically deleted after 30 days for your privacy protection.
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips Section */}
      <motion.div 
        variants={fadeInUp} 
        initial="initial" 
        animate="animate"
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scanning Tips</CardTitle>
            <CardDescription>
              Get the best results from your scam detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Include Full Context</div>
                    <div className="text-xs text-muted-foreground">
                      Upload complete conversations for better analysis
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Clear Screenshots</div>
                    <div className="text-xs text-muted-foreground">
                      Ensure text is readable and not cropped
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Multiple Files</div>
                    <div className="text-xs text-muted-foreground">
                      Upload related messages together for context
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Report Issues</div>
                    <div className="text-xs text-muted-foreground">
                      Let us know if results seem incorrect
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}